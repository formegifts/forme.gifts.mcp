import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { issueDeviceCode, pollDeviceCode } from '../../src/auth/device-flow'

describe('issueDeviceCode', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('POSTs { client_type: "mcp" } to /api/auth/device and returns the parsed response', async () => {
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
    expect(JSON.parse(init.body as string)).toEqual({ client_type: 'mcp' })
    expect(result).toEqual(response)
  })

  it('throws on non-2xx with server error body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'server_error', error_description: 'boom' }), { status: 500 })
    )
    await expect(issueDeviceCode()).rejects.toThrow(/server_error/)
  })
})

describe('pollDeviceCode', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('returns approved with tokens on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: 'at',
          refresh_token: 'rt',
          token_type: 'bearer',
          expires_in: 3600,
        }),
        { status: 200 }
      )
    )
    const result = await pollDeviceCode('dev123')
    expect(result).toEqual({
      status: 'approved',
      tokens: { access_token: 'at', refresh_token: 'rt', expires_in: 3600 },
    })
  })

  it('returns pending on authorization_pending', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ error: 'authorization_pending', error_description: 'waiting' }),
        { status: 400 }
      )
    )
    expect(await pollDeviceCode('dev123')).toEqual({ status: 'pending' })
  })

  it('returns slow_down on slow_down', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'slow_down', error_description: '' }), { status: 400 })
    )
    expect(await pollDeviceCode('dev123')).toEqual({ status: 'slow_down' })
  })

  it('returns expired on expired_token', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'expired_token', error_description: '' }), { status: 400 })
    )
    expect(await pollDeviceCode('dev123')).toEqual({ status: 'expired' })
  })

  it('sends correct POST body', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ access_token: 'at', refresh_token: 'rt', token_type: 'bearer', expires_in: 3600 }),
        { status: 200 }
      )
    )
    await pollDeviceCode('dev123')
    const [url, init] = spy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://forme.gifts/api/auth/device/token')
    expect(JSON.parse(init.body as string)).toEqual({
      grant_type: 'device_code',
      device_code: 'dev123',
    })
  })
})
