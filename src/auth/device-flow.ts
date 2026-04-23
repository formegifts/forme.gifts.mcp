import { API_BASE } from '../config'

export type DeviceCodeResponse = {
  device_code: string
  user_code: string
  verification_url: string
  expires_in: number
  interval: number
}

export const issueDeviceCode = async (): Promise<DeviceCodeResponse> => {
  const res = await fetch(`${API_BASE}/api/auth/device`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ client_type: 'cli' }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'network_error' }))
    throw new Error(`${body.error ?? 'unknown'}: ${body.error_description ?? res.statusText}`)
  }
  return (await res.json()) as DeviceCodeResponse
}

export type PollResult =
  | {
      status: 'approved'
      tokens: { access_token: string; refresh_token: string; expires_in: number }
    }
  | { status: 'pending' }
  | { status: 'slow_down' }

export const pollDeviceCode = async (deviceCode: string): Promise<PollResult> => {
  const res = await fetch(`${API_BASE}/api/auth/device/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ grant_type: 'device_code', device_code: deviceCode }),
  })

  const body = await res.json().catch(() => ({ error: 'network_error' }))

  if (res.ok) {
    return {
      status: 'approved',
      tokens: {
        access_token: body.access_token,
        refresh_token: body.refresh_token,
        expires_in: body.expires_in,
      },
    }
  }

  switch (body.error) {
    case 'authorization_pending':
      return { status: 'pending' }
    case 'slow_down':
      return { status: 'slow_down' }
    case 'expired_token':
      throw new Error('Device code expired. Run `forme-mcp auth` again.')
    default:
      throw new Error(`${body.error ?? 'unknown'}: ${body.error_description ?? res.statusText}`)
  }
}
