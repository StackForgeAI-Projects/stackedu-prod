import { AccessToken, EgressClient, EncodedFileOutput, EncodedFileType, RoomServiceClient, S3Upload } from 'livekit-server-sdk'
import { env } from '../config/env'
import { conflict, serviceUnavailable } from './errors'
import { resolveLiveKitCredentials } from './integration-credentials'
import { isIntegrationEnabled } from './integrations'

export interface MediaJoinToken {
  url: string
  token: string
  roomName: string
}

export interface MediaRoomAdapter {
  isConfigured(): boolean
  canRecordToObjectStorage(): boolean
  participantToken(input: {
    roomName: string
    identity: string
    name: string
    canPublish: boolean
    roomAdmin: boolean
  }): Promise<MediaJoinToken>
  ensureRoom(roomName: string): Promise<void>
  closeRoom(roomName: string): Promise<void>
  startRecording(input: { roomName: string; fileKey: string }): Promise<{ jobId: string }>
  stopRecording(jobId: string): Promise<void>
  muteAllStudents(roomName: string, hostIdentity: string): Promise<number>
  roomParticipantCount?(roomName: string): Promise<number>
}

let override: MediaRoomAdapter | null = null

export function setMediaRoomAdapter(adapter: MediaRoomAdapter | null): void {
  override = adapter
}

export function mediaRoom(): MediaRoomAdapter {
  return override ?? createLiveKitAdapter(liveKitFromEnv())
}

/** Prefer ICT-saved keys, then the server environment. Tests still inject via setMediaRoomAdapter. */
export async function mediaRoomFor(institutionId: string): Promise<MediaRoomAdapter> {
  if (override) return override
  if (!(await isIntegrationEnabled(institutionId, 'LiveKit'))) {
    return createLiveKitAdapter(null)
  }
  return createLiveKitAdapter(await resolveLiveKitCredentials(institutionId))
}

function liveKitFromEnv(): { url: string; apiKey: string; apiSecret: string } | null {
  const settings = env()
  if (!settings.LIVEKIT_URL || !settings.LIVEKIT_API_KEY || !settings.LIVEKIT_API_SECRET) return null
  return {
    url: settings.LIVEKIT_URL,
    apiKey: settings.LIVEKIT_API_KEY,
    apiSecret: settings.LIVEKIT_API_SECRET,
  }
}

function createLiveKitAdapter(creds: { url: string; apiKey: string; apiSecret: string } | null): MediaRoomAdapter {
  const requireLiveKit = () => {
    if (!creds) {
      throw serviceUnavailable(
        'Live video is not configured. Ask ICT to add the LiveKit URL, API key and secret under Integrations.',
      )
    }
    return creds
  }

  return {
    isConfigured: () => Boolean(creds),
    canRecordToObjectStorage() {
      const settings = env()
      return (
        settings.STORAGE_DRIVER === 'r2' &&
        Boolean(settings.R2_ACCOUNT_ID && settings.R2_ACCESS_KEY_ID && settings.R2_SECRET_ACCESS_KEY && settings.R2_BUCKET)
      )
    },
    async participantToken(input) {
      const settings = requireLiveKit()
      const token = new AccessToken(settings.apiKey, settings.apiSecret, {
        identity: input.identity,
        name: input.name,
      })
      token.addGrant({
        roomJoin: true,
        room: input.roomName,
        canPublish: input.canPublish,
        canSubscribe: true,
        roomAdmin: input.roomAdmin,
      })
      return {
        url: settings.url,
        token: await token.toJwt(),
        roomName: input.roomName,
      }
    },
    async ensureRoom(roomName) {
      const settings = requireLiveKit()
      const rooms = new RoomServiceClient(settings.url, settings.apiKey, settings.apiSecret)
      await rooms.createRoom({ name: roomName, emptyTimeout: 60 * 30, maxParticipants: 200 })
    },
    async closeRoom(roomName) {
      const settings = requireLiveKit()
      const rooms = new RoomServiceClient(settings.url, settings.apiKey, settings.apiSecret)
      await rooms.deleteRoom(roomName).catch(() => undefined)
    },
    async startRecording(input) {
      const settings = requireLiveKit()
      if (!this.canRecordToObjectStorage()) {
        throw conflict('Recordings need object storage (R2). Local disk cannot receive a live recording.')
      }
      const r2 = env()
      const egress = new EgressClient(settings.url, settings.apiKey, settings.apiSecret)
      const file = new EncodedFileOutput({
        fileType: EncodedFileType.MP4,
        filepath: input.fileKey,
        output: {
          case: 's3',
          value: new S3Upload({
            accessKey: r2.R2_ACCESS_KEY_ID!,
            secret: r2.R2_SECRET_ACCESS_KEY!,
            region: 'auto',
            endpoint: `https://${r2.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            bucket: r2.R2_BUCKET!,
            forcePathStyle: true,
          }),
        },
      })
      const info = await egress.startRoomCompositeEgress(input.roomName, { file })
      if (!info.egressId) throw serviceUnavailable('The media server did not start a recording.')
      return { jobId: info.egressId }
    },
    async stopRecording(jobId) {
      const settings = requireLiveKit()
      const egress = new EgressClient(settings.url, settings.apiKey, settings.apiSecret)
      await Promise.race([
        egress.stopEgress(jobId).then(() => undefined),
        new Promise<void>((resolve) => setTimeout(resolve, 8000)),
      ])
    },
    async roomParticipantCount(roomName) {
      const settings = requireLiveKit()
      const rooms = new RoomServiceClient(settings.url, settings.apiKey, settings.apiSecret)
      try {
        const participants = await rooms.listParticipants(roomName)
        return participants.length
      } catch {
        return 0
      }
    },
    async muteAllStudents(roomName, hostIdentity) {
      const settings = requireLiveKit()
      const rooms = new RoomServiceClient(settings.url, settings.apiKey, settings.apiSecret)
      const participants = await rooms.listParticipants(roomName)
      let muted = 0
      for (const participant of participants) {
        if (participant.identity === hostIdentity) continue
        for (const track of participant.tracks ?? []) {
          const sid = track.sid
          if (!sid || track.muted) continue
          const source = String(track.source ?? '')
          const isMic = source.includes('MICROPHONE') || source === '2'
          if (!isMic) continue
          await rooms.mutePublishedTrack(roomName, participant.identity, sid, true)
          muted += 1
        }
      }
      return muted
    },
  }
}
