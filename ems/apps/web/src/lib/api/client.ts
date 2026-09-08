import { firstValidationDetail, type ApiError, type ApiErrorCode } from '@stackedu/shared'

/**
 * The single place the web app talks to the API.
 *
 * The app is served from app.stackedu.rw and app.stackedu.africa while the API
 * answers on its own host, so every call is cross-origin. That has two
 * consequences handled here rather than at each call site: the base URL comes
 * from configuration, and credentials must be sent explicitly or the session
 * cookie is silently dropped.
 */

const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export class ApiClientError extends Error {
  readonly code: ApiErrorCode | 'NETWORK_ERROR'
  readonly status: number
  readonly details?: Record<string, string[]>
  /** Quote this to support and they can find the exact request in the logs. */
  readonly requestId?: string

  constructor(
    code: ApiErrorCode | 'NETWORK_ERROR',
    status: number,
    message: string,
    options?: { details?: Record<string, string[]>; requestId?: string },
  ) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
    this.status = status
    this.details = options?.details
    this.requestId = options?.requestId
  }

  /** True when retrying might succeed, so the UI can offer a "try again". */
  get isRetryable(): boolean {
    return this.code === 'NETWORK_ERROR' || this.status >= 500 || this.status === 429
  }
}

/**
 * What to show the user when a call fails.
 *
 * A validation failure's summary ("Some fields need your attention") tells them
 * nothing, so the first field message is preferred when there is one.
 */
export type ApiBreakCategory = 'connection' | 'backend' | 'database'

export interface ApiErrorDiagnosis {
  /** Present only for API / backend / database breaks — not validation or auth. */
  breakCategory?: ApiBreakCategory
  label: string
  message: string
  requestId?: string
}

function isApiBreak(error: ApiClientError): boolean {
  return (
    error.code === 'NETWORK_ERROR'
    || error.code === 'SERVICE_UNAVAILABLE'
    || error.status >= 500
  )
}

/**
 * Explains infrastructure failures in plain language so support can tell
 * whether the API, backend, or database is at fault.
 */
export function apiErrorDiagnosis(error: unknown, fallback = 'We could not load this page. Please try again.'): ApiErrorDiagnosis {
  if (!(error instanceof ApiClientError)) {
    return { label: 'Something went wrong', message: fallback }
  }

  const detail = firstValidationDetail(error.details)
  if (detail) {
    return { label: 'Check your input', message: detail }
  }

  if (error.code === 'VALIDATION_FAILED') {
    return {
      label: 'Check your input',
      message: 'Please check the form and fix the highlighted fields.',
    }
  }

  if (error.code === 'NETWORK_ERROR') {
    return {
      breakCategory: 'connection',
      label: 'Connection problem',
      message: 'We could not connect to StackEDU. Please check your internet connection and try again.',
      ...(error.requestId ? { requestId: error.requestId } : {}),
    }
  }

  if (error.code === 'SERVICE_UNAVAILABLE' || error.status === 503) {
    return {
      breakCategory: 'database',
      label: 'Service unavailable',
      message: 'StackEDU is temporarily unavailable. Please try again in a few minutes.',
      ...(error.requestId ? { requestId: error.requestId } : {}),
    }
  }

  if (error.status >= 500 || error.code === 'INTERNAL_ERROR') {
    return {
      breakCategory: 'backend',
      label: 'Server error',
      message: 'Something went wrong on our servers. Please try again shortly.',
      ...(error.requestId ? { requestId: error.requestId } : {}),
    }
  }

  return {
    label: 'Request failed',
    message: error.message,
    ...(error.requestId ? { requestId: error.requestId } : {}),
  }
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  return apiErrorDiagnosis(error, fallback).message
}

export function isApiBreakError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError && isApiBreak(error)
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
  /** Makes a repeated write safe, used for payments and other one-off actions. */
  idempotencyKey?: string
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(path.startsWith('/') ? path.slice(1) : path, `${API_URL}/`)

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  return url.toString()
}

function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ApiError).error?.code === 'string'
  )
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal, idempotencyKey } = options

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (idempotencyKey) headers['idempotency-key'] = idempotencyKey

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      // Without this the session cookie is not sent cross-origin, and every
      // request would look unauthenticated.
      credentials: 'include',
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      ...(signal ? { signal } : {}),
    })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiClientError(
      'NETWORK_ERROR',
      0,
      'We could not reach StackEDU. Please check your connection and try again.',
    )
  }

  if (response.status === 204) return undefined as T

  const payload: unknown = await response.json().catch(() => undefined)

  if (!response.ok) {
    if (isApiError(payload)) {
      throw new ApiClientError(
        payload.error.code as ApiErrorCode,
        response.status,
        payload.error.message,
        {
          ...(payload.error.details ? { details: payload.error.details } : {}),
          ...(payload.error.requestId ? { requestId: payload.error.requestId } : {}),
        },
      )
    }

    throw new ApiClientError('INTERNAL_ERROR', response.status, 'Something went wrong.', {
      ...(response.headers.get('x-request-id')
        ? { requestId: response.headers.get('x-request-id')! }
        : {}),
    })
  }

  return payload as T
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
}

export { API_URL }
