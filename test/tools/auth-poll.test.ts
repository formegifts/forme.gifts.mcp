import { describe, expect, it, vi } from 'vitest'
import type { Credentials } from '../../src/auth/credentials'
import type { PollResult } from '../../src/auth/device-flow'
import { type AuthPollDeps, authPoll } from '../../src/tools/auth-poll'
import { McpToolError } from '../../src/errors'

const APPROVED_TOKENS = {
  access_token: 'jwt.eyJlbWFpbCI6InVAZXhhbXBsZS5jb20ifQ.sig',
  refresh_token: 'r',
  expires_in: 3600,
}

const approvedResult: PollResult = { status: 'approved', tokens: APPROVED_TOKENS }

const makeDeps = (
  overrides: Partial<AuthPollDeps> = {}
): AuthPollDeps & { written: Credentials[] } => {
  const written: Credentials[] = []
  let nowMs = 1_000_000
  const deps: AuthPollDeps = {
    pollDeviceCode: vi.fn(async () => approvedResult),
    writeCredentials: async (c) => {
      written.push(c)
    },
    sleep: vi.fn(async () => {
      nowMs += 5_000
    }),
    now: () => nowMs,
    ...overrides,
  }
  return Object.assign(deps, { written })
}

describe('authPoll', () => {
  it('returns signed_in and persists credentials on first-poll approval', async () => {
    const deps = makeDeps()
    const result = await authPoll({ device_code: 'dev123' }, deps)
    expect(result).toEqual({ status: 'signed_in', email: 'u@example.com' })
    expect(deps.written).toHaveLength(1)
    expect(deps.written[0]).toMatchObject({
      access_token: APPROVED_TOKENS.access_token,
      refresh_token: APPROVED_TOKENS.refresh_token,
      email: 'u@example.com',
    })
    expect(deps.written[0].expires_at).toMatch(/\d{4}-\d{2}-\d{2}T/)
  })

  it('keeps polling on pending until approved', async () => {
    const poll = vi
      .fn<(d: string) => Promise<PollResult>>()
      .mockResolvedValueOnce({ status: 'pending' })
      .mockResolvedValueOnce({ status: 'pending' })
      .mockResolvedValueOnce(approvedResult)
    const deps = makeDeps({ pollDeviceCode: poll })
    const result = await authPoll({ device_code: 'dev123' }, deps)
    expect(poll).toHaveBeenCalledTimes(3)
    expect(result.status).toBe('signed_in')
  })

  it('doubles interval on slow_down', async () => {
    const poll = vi
      .fn<(d: string) => Promise<PollResult>>()
      .mockResolvedValueOnce({ status: 'slow_down' })
      .mockResolvedValueOnce(approvedResult)
    const sleep = vi.fn(async () => {})
    const deps = makeDeps({ pollDeviceCode: poll, sleep })
    await authPoll({ device_code: 'dev123' }, deps)
    expect(sleep).toHaveBeenNthCalledWith(1, 10_000)
  })

  it('returns expired when device flow returns expired', async () => {
    const poll = vi.fn<(d: string) => Promise<PollResult>>().mockResolvedValueOnce({ status: 'expired' })
    const deps = makeDeps({ pollDeviceCode: poll })
    const result = await authPoll({ device_code: 'dev123' }, deps)
    expect(result).toEqual({ status: 'expired' })
    expect(deps.written).toHaveLength(0)
  })

  it('returns pending when deadline elapses before approval', async () => {
    let nowMs = 1_000_000
    const deadline = nowMs + 45_000
    const poll = vi.fn<(d: string) => Promise<PollResult>>(async () => ({ status: 'pending' }))
    const sleep = vi.fn(async () => {
      nowMs += 5_000
    })
    const result = await authPoll(
      { device_code: 'dev123' },
      {
        pollDeviceCode: poll,
        writeCredentials: async () => {},
        sleep,
        now: () => nowMs,
      }
    )
    expect(result).toEqual({ status: 'pending' })
    expect(nowMs).toBeGreaterThanOrEqual(deadline)
  })

  it('throws failed_precondition when JWT lacks email', async () => {
    const poll = vi.fn<(d: string) => Promise<PollResult>>().mockResolvedValueOnce({
      status: 'approved',
      tokens: { access_token: 'invalid.jwt', refresh_token: 'r', expires_in: 60 },
    })
    const deps = makeDeps({ pollDeviceCode: poll })
    await expect(authPoll({ device_code: 'dev123' }, deps)).rejects.toBeInstanceOf(McpToolError)
  })

  it('propagates unknown errors from pollDeviceCode', async () => {
    const poll = vi.fn<(d: string) => Promise<PollResult>>(async () => {
      throw new Error('boom')
    })
    const deps = makeDeps({ pollDeviceCode: poll })
    await expect(authPoll({ device_code: 'dev123' }, deps)).rejects.toThrow(/boom/)
  })
})
