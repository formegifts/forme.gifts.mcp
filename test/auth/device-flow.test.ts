import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { issueDeviceCode } from '../../src/auth/device-flow'

describe('issueDeviceCode', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('POSTs { client_type: "cli" } to /api/auth/device and returns the parsed response', async () => {
    const response = {
      device_code: 'dev123',
      user_code: 'AAAA-BBBB',
      verification_url: 'https://forme.gifts/auth/device?code=AAAA-BBBB',
      expires_in: 600,
      interval: 5,
    }
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(response), { status: 200 })
    )

    const result = await issueDeviceCode()

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://forme.gifts/api/auth/device')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({ 'content-type': 'application/json' })
    expect(JSON.parse(init.body as string)).toEqual({ client_type: 'cli' })
    expect(result).toEqual(response)
  })

  it('throws on non-2xx with server error body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'server_error', error_description: 'boom' }), { status: 500 })
    )
    await expect(issueDeviceCode()).rejects.toThrow(/server_error/)
  })
})
