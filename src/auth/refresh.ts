import { API_BASE } from '../config'
import { SESSION_ENDED_MESSAGE } from '../errors'
import { deleteCredentials, readCredentials, writeCredentials } from './credentials'

const REFRESH_LEEWAY_MS = 60 * 1000

export class SessionEndedError extends Error {
  constructor() {
    super(SESSION_ENDED_MESSAGE)
    this.name = 'SessionEndedError'
  }
}

export const refreshIfNeeded = async (): Promise<string> => {
  const creds = await readCredentials()
  if (!creds) throw new SessionEndedError()

  const expiresAt = new Date(creds.expires_at).getTime()
  if (expiresAt - Date.now() > REFRESH_LEEWAY_MS) {
    return creds.access_token
  }

  const res = await fetch(`${API_BASE}/api/auth/device/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: creds.refresh_token }),
  })
  const body = await res.json().catch(() => ({ error: 'network_error' }))

  if (!res.ok) {
    if (body.error === 'invalid_grant') {
      await deleteCredentials()
      throw new SessionEndedError()
    }
    throw new Error(
      `Refresh failed: ${body.error ?? 'unknown'}: ${body.error_description ?? res.statusText}`
    )
  }

  const updated = {
    ...creds,
    access_token: body.access_token as string,
    refresh_token: body.refresh_token as string,
    expires_at: new Date(Date.now() + (body.expires_in as number) * 1000).toISOString(),
  }
  await writeCredentials(updated)
  return updated.access_token
}
