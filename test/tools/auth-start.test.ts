import { describe, expect, it, vi } from 'vitest'
import type { DeviceCodeResponse } from '../../src/auth/device-flow'
import { authStart } from '../../src/tools/auth-start'

const sampleResponse: DeviceCodeResponse = {
  device_code: 'dev123',
  user_code: 'AAAA-BBBB',
  verification_url: 'https://forme.gifts/auth/device?code=AAAA-BBBB',
  expires_in: 600,
  interval: 5,
}

describe('authStart', () => {
  it('returns the issued device code response', async () => {
    const issueDeviceCode = vi.fn(async () => sampleResponse)
    const result = await authStart({}, { issueDeviceCode })
    expect(issueDeviceCode).toHaveBeenCalledOnce()
    expect(result).toEqual(sampleResponse)
  })

  it('propagates errors from issueDeviceCode', async () => {
    const issueDeviceCode = vi.fn(async () => {
      throw new Error('network_error')
    })
    await expect(authStart({}, { issueDeviceCode })).rejects.toThrow(/network_error/)
  })
})
