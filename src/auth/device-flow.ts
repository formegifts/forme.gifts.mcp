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
