import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { closeSync, createReadStream, createWriteStream, existsSync, mkdirSync, openSync, readFileSync, readSync } from 'node:fs'
import { unlink, rm } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { MAX_UPLOAD_BYTES, uploadLimitMessage } from '@stackedu/shared'
import { env } from '../config/env'
import { badRequest, internalError } from './errors'

const UPLOAD_TTL_SECONDS = 15 * 60
const DOWNLOAD_TTL_SECONDS = 10 * 60

export interface UploadTarget {
  uploadUrl: string
  uploadMethod: 'PUT'
  headers: Record<string, string>
}

function signingSecret(): string {
  const configured = env().STORAGE_SIGNING_SECRET
  if (configured) return configured
  if (env().NODE_ENV === 'production') {
    throw internalError(new Error('STORAGE_SIGNING_SECRET is not configured'))
  }
  return 'stackedu-local-dev-signing-secret'
}

function localRoot(): string {
  const root = path.resolve(env().STORAGE_LOCAL_ROOT)
  if (!existsSync(root)) mkdirSync(root, { recursive: true })
  return root
}

function localPathFor(fileKey: string): string {
  const resolved = path.resolve(localRoot(), fileKey)
  if (!resolved.startsWith(localRoot() + path.sep) && resolved !== localRoot()) {
    throw badRequest('Invalid file key.')
  }
  return resolved
}

function r2Client(): S3Client {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = env()
  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  })
}

/** Object key scoped to the institution and application — never guessable alone. */
export function buildFileKey(input: {
  institutionId: string
  applicationId: string
  documentType: string
  fileName: string
}): string {
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80)
  return [
    'institutions',
    input.institutionId,
    'applications',
    input.applicationId,
    input.documentType,
    `${randomUUID()}-${safeName}`,
  ].join('/')
}

function signLocalToken(payload: string): string {
  return createHmac('sha256', signingSecret()).update(payload).digest('base64url')
}

export function createLocalUploadToken(input: {
  fileKey: string
  mimeType: string
  fileSizeBytes: number
  expiresAt: number
}): string {
  const body = [
    input.fileKey,
    input.mimeType,
    String(input.fileSizeBytes),
    String(input.expiresAt),
  ].join('|')
  return `${Buffer.from(body).toString('base64url')}.${signLocalToken(body)}`
}

export function verifyLocalUploadToken(token: string): {
  fileKey: string
  mimeType: string
  fileSizeBytes: number
} {
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) throw badRequest('Upload link is invalid or expired.')

  let body: string
  try {
    body = Buffer.from(encoded, 'base64url').toString('utf8')
  } catch {
    throw badRequest('Upload link is invalid or expired.')
  }

  const expected = signLocalToken(body)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw badRequest('Upload link is invalid or expired.')
  }

  const [fileKey, mimeType, sizeRaw, expiresRaw] = body.split('|')
  const expiresAt = Number(expiresRaw)
  const fileSizeBytes = Number(sizeRaw)
  if (!fileKey || !mimeType || !Number.isFinite(expiresAt) || !Number.isFinite(fileSizeBytes)) {
    throw badRequest('Upload link is invalid or expired.')
  }
  if (Date.now() > expiresAt) throw badRequest('Upload link has expired. Request a new one.')

  return { fileKey, mimeType, fileSizeBytes }
}

export async function createUploadTarget(input: {
  fileKey: string
  mimeType: string
  fileSizeBytes: number
}): Promise<UploadTarget> {
  if (env().STORAGE_DRIVER === 'r2') {
    const command = new PutObjectCommand({
      Bucket: env().R2_BUCKET!,
      Key: input.fileKey,
      ContentType: input.mimeType,
      ContentLength: input.fileSizeBytes,
    })
    const uploadUrl = await getSignedUrl(r2Client(), command, { expiresIn: UPLOAD_TTL_SECONDS })
    return {
      uploadUrl,
      uploadMethod: 'PUT',
      headers: {
        'Content-Type': input.mimeType,
      },
    }
  }

  const expiresAt = Date.now() + UPLOAD_TTL_SECONDS * 1000
  const token = createLocalUploadToken({ ...input, expiresAt })
  return {
    uploadUrl: `${env().API_PUBLIC_URL}/apply/documents/upload/${token}`,
    uploadMethod: 'PUT',
    headers: {
      'Content-Type': input.mimeType,
    },
  }
}

export async function writeLocalUpload(
  token: string,
  body: Buffer,
  contentLength: number | undefined,
): Promise<void> {
  const { fileKey, mimeType, fileSizeBytes } = verifyLocalUploadToken(token)
  if (contentLength !== undefined && contentLength !== fileSizeBytes) {
    throw badRequest('File size does not match the upload reservation.')
  }
  if (body.byteLength !== fileSizeBytes) {
    throw badRequest('File size does not match the upload reservation.')
  }

  const destination = localPathFor(fileKey)
  mkdirSync(path.dirname(destination), { recursive: true })
  await pipeline(Readable.from(body), createWriteStream(destination))

  // mimeType is reserved for future content sniffing; keep the contract clear.
  void mimeType
}

export async function createDownloadUrl(fileKey: string): Promise<{
  url: string
  expiresAt: string
}> {
  const expiresAt = new Date(Date.now() + DOWNLOAD_TTL_SECONDS * 1000).toISOString()

  if (env().STORAGE_DRIVER === 'r2') {
    const command = new GetObjectCommand({
      Bucket: env().R2_BUCKET!,
      Key: fileKey,
    })
    const url = await getSignedUrl(r2Client(), command, { expiresIn: DOWNLOAD_TTL_SECONDS })
    return { url, expiresAt }
  }

  const token = createLocalUploadToken({
    fileKey,
    mimeType: 'application/octet-stream',
    fileSizeBytes: 0,
    expiresAt: Date.now() + DOWNLOAD_TTL_SECONDS * 1000,
  })
  return {
    url: `${env().API_PUBLIC_URL}/apply/documents/file/${token}`,
    expiresAt,
  }
}

export function openLocalFile(token: string): {
  stream: ReturnType<typeof createReadStream>
  fileKey: string
} {
  const { fileKey } = verifyLocalUploadToken(token)
  const filePath = localPathFor(fileKey)
  if (!existsSync(filePath)) throw badRequest('That file is not available.')
  return { stream: createReadStream(filePath), fileKey }
}

export async function deleteStoredObject(fileKey: string): Promise<void> {
  if (env().STORAGE_DRIVER === 'r2') {
    await r2Client().send(
      new DeleteObjectCommand({
        Bucket: env().R2_BUCKET!,
        Key: fileKey,
      }),
    )
    return
  }

  const filePath = localPathFor(fileKey)
  if (existsSync(filePath)) await unlink(filePath)
}

/** Deletes every stored object under a prefix. Returns how many objects were removed. */
export async function deleteStoredObjectsByPrefix(prefix: string): Promise<number> {
  const normalised = prefix.endsWith('/') ? prefix : `${prefix}/`

  if (env().STORAGE_DRIVER === 'r2') {
    const bucket = env().R2_BUCKET!
    let deleted = 0
    let continuationToken: string | undefined

    do {
      const page = await r2Client().send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: normalised,
          ContinuationToken: continuationToken,
        }),
      )

      const keys = (page.Contents ?? [])
        .map((entry) => entry.Key)
        .filter((key): key is string => Boolean(key))

      if (keys.length > 0) {
        await r2Client().send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
          }),
        )
        deleted += keys.length
      }

      continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined
    } while (continuationToken)

    return deleted
  }

  const directory = localPathFor(normalised.slice(0, -1))
  if (!existsSync(directory)) return 0
  await rm(directory, { recursive: true, force: true })
  return 1
}

/** Logo formats the system accepts, and the extension each one is stored under. */
const LOGO_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

const LOGO_MIME_BY_EXTENSION: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
}

const LOGO_TYPE_MESSAGE = 'Upload a PNG, JPEG, WebP or SVG logo.'

/** Must stay in step with the body limit the upload route allows through. */
export const LOGO_MAX_BYTES = MAX_UPLOAD_BYTES

/**
 * The extension is part of the key because it is the only place the image
 * format survives: the local driver has nothing else to derive a Content-Type
 * from when the file is read back, and a logo served as an octet-stream is
 * refused by every browser.
 */
export function buildInstitutionLogoKey(institutionId: string, mimeType: string): string {
  const extension = LOGO_EXTENSIONS[mimeType]
  if (!extension) throw badRequest(LOGO_TYPE_MESSAGE)
  return `institutions/${institutionId}/branding/logo.${extension}`
}

export function buildCourseMaterialFileKey(input: {
  institutionId: string
  offeringId: string
  fileName: string
}): string {
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80)
  return [
    'institutions',
    input.institutionId,
    'offerings',
    input.offeringId,
    'materials',
    `${randomUUID()}-${safeName}`,
  ].join('/')
}

export function buildQuestionImportFileKey(input: {
  institutionId: string
  fileName: string
}): string {
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80)
  return ['institutions', input.institutionId, 'question-imports', `${randomUUID()}-${safeName}`].join('/')
}

export function buildLibraryFileKey(input: {
  institutionId: string
  resourceId: string
  fileName: string
}): string {
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80)
  return [
    'institutions',
    input.institutionId,
    'library',
    input.resourceId,
    `${randomUUID()}-${safeName}`,
  ].join('/')
}

export function libraryFileKeyPrefix(institutionId: string, resourceId: string): string {
  return `institutions/${institutionId}/library/${resourceId}/`
}

export function buildSessionObjectKey(input: {
  institutionId: string
  sessionId: string
  kind: 'whiteboard' | 'recording'
  fileName: string
}): string {
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80)
  return [
    'institutions',
    input.institutionId,
    'sessions',
    input.sessionId,
    input.kind,
    `${randomUUID()}-${safeName}`,
  ].join('/')
}

/** System-owned live-sync blob. Not a user upload, so the name is stable and recoverable. */
export function buildStableSessionObjectKey(input: {
  institutionId: string
  sessionId: string
  kind: 'whiteboard'
  fileName: string
}): string {
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80)
  return ['institutions', input.institutionId, 'sessions', input.sessionId, input.kind, safeName].join('/')
}

export async function putStoredObject(input: {
  fileKey: string
  body: Buffer
  mimeType: string
}): Promise<void> {
  if (!input.fileKey.startsWith('institutions/')) {
    throw badRequest('Invalid file key.')
  }
  if (env().STORAGE_DRIVER === 'r2') {
    await r2Client().send(
      new PutObjectCommand({
        Bucket: env().R2_BUCKET!,
        Key: input.fileKey,
        Body: input.body,
        ContentType: input.mimeType,
      }),
    )
    return
  }
  const destination = localPathFor(input.fileKey)
  mkdirSync(path.dirname(destination), { recursive: true })
  await pipeline(Readable.from(input.body), createWriteStream(destination))
}

export async function readStoredObject(fileKey: string): Promise<Buffer | null> {
  if (env().STORAGE_DRIVER === 'r2') {
    try {
      const result = await r2Client().send(
        new GetObjectCommand({
          Bucket: env().R2_BUCKET!,
          Key: fileKey,
        }),
      )
      const bytes = await result.Body?.transformToByteArray()
      return bytes ? Buffer.from(bytes) : null
    } catch {
      return null
    }
  }
  const filePath = localPathFor(fileKey)
  if (!existsSync(filePath)) return null
  return readFileSync(filePath)
}

/**
 * Reads a bounded prefix of an object. Used to draft a description, never to
 * serve the file: downloads still go through createDownloadUrl.
 */
export async function readStoredObjectSample(fileKey: string, maxBytes = 160_000): Promise<Buffer> {
  if (env().STORAGE_DRIVER === 'r2') {
    const result = await r2Client().send(
      new GetObjectCommand({
        Bucket: env().R2_BUCKET!,
        Key: fileKey,
        Range: `bytes=0-${maxBytes - 1}`,
      }),
    )
    const bytes = await result.Body?.transformToByteArray()
    if (!bytes) throw badRequest('That file is not available.')
    return Buffer.from(bytes)
  }

  const filePath = localPathFor(fileKey)
  if (!existsSync(filePath)) throw badRequest('That file is not available.')
  const handle = openSync(filePath, 'r')
  try {
    const buf = Buffer.alloc(maxBytes)
    const n = readSync(handle, buf, 0, maxBytes, 0)
    return buf.subarray(0, n)
  } finally {
    closeSync(handle)
  }
}

export function fileNameFromStorageKey(fileKey: string): string {
  const leaf = fileKey.split('/').pop() ?? fileKey
  const dash = leaf.indexOf('-')
  return dash >= 0 ? leaf.slice(dash + 1) : leaf
}

export async function writeInstitutionLogo(input: {
  institutionId: string
  body: Buffer
  mimeType: string
}): Promise<string> {
  if (!LOGO_EXTENSIONS[input.mimeType]) throw badRequest(LOGO_TYPE_MESSAGE)
  if (input.body.byteLength > LOGO_MAX_BYTES) {
    throw badRequest(uploadLimitMessage())
  }

  const fileKey = buildInstitutionLogoKey(input.institutionId, input.mimeType)

  if (env().STORAGE_DRIVER === 'r2') {
    await r2Client().send(
      new PutObjectCommand({
        Bucket: env().R2_BUCKET!,
        Key: fileKey,
        Body: input.body,
        ContentType: input.mimeType,
      }),
    )
    return fileKey
  }

  const destination = localPathFor(fileKey)
  mkdirSync(path.dirname(destination), { recursive: true })
  await pipeline(Readable.from(input.body), createWriteStream(destination))
  return fileKey
}

export function openInstitutionLogo(fileKey: string): {
  stream: ReturnType<typeof createReadStream>
  mimeType: string
} {
  if (env().STORAGE_DRIVER === 'r2') {
    throw internalError(new Error('Institution logo streaming is only supported for local storage.'))
  }

  const filePath = localPathFor(fileKey)
  if (!existsSync(filePath)) throw badRequest('That logo is not available.')

  const extension = path.extname(filePath).toLowerCase()
  // Logos uploaded before the extension was part of the key still have to be
  // served with a real image type, so fall back to reading the file signature.
  const mimeType = LOGO_MIME_BY_EXTENSION[extension] ?? sniffImageMimeType(filePath)

  return { stream: createReadStream(filePath), mimeType }
}

function sniffImageMimeType(filePath: string): string {
  const head = Buffer.alloc(12)
  const handle = openSync(filePath, 'r')
  try {
    readSync(handle, head, 0, head.byteLength, 0)
  } finally {
    closeSync(handle)
  }

  if (head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png'
  }
  if (head[0] === 0xff && head[1] === 0xd8) return 'image/jpeg'
  if (head.subarray(0, 4).toString('ascii') === 'RIFF' && head.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp'
  }
  if (head.toString('utf8').trimStart().startsWith('<')) return 'image/svg+xml'
  return 'application/octet-stream'
}
