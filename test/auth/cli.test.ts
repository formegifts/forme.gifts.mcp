import { describe, expect, it, vi } from 'vitest'
import type { Credentials } from '../../src/auth/credentials'
import { runAuth, runLogout, runWhoami, type AuthDeps } from '../../src/auth/cli'

const makeDeps = (overrides: Partial<AuthDeps> = {}): AuthDeps & { written: Credentials[] } => {
  const written: Credentials[] = []
  const deps: AuthDeps = {
    issueDeviceCode: async () => ({
      device_code: 'dev',
      user_code: 'ABCD-EFGH',
      verification_url: 'https://forme.gifts/auth/device?code=ABCD-EFGH',
      expires_in: 600,
      interval: 1,
    }),
    pollDeviceCode: async () => ({
      status: 'approved',
      tokens: { access_token: 'jwt.eyJlbWFpbCI6InVAZXhhbXBsZS5jb20ifQ.sig', refresh_token: 'r', expires_in: 3600 },
    }),
    openBrowser: vi.fn(),
    writeCredentials: async (c) => {
      written.push(c)
    },
    sleep: vi.fn(async () => {}),
    log: vi.fn(),
    ...overrides,
  }
  return Object.assign(deps, { written })
}

describe('runAuth', () => {
  it('prints verification URL, opens browser, polls, writes credentials', async () => {
    const deps = makeDeps()
    await runAuth(deps)
    expect(deps.openBrowser).toHaveBeenCalledWith(expect.stringContaining('/auth/device?code='))
    expect(deps.written).toHaveLength(1)
    expect(deps.written[0].email).toBe('u@example.com')
    expect(deps.written[0].access_token).toContain('eyJlbWFpbCI')
  })

  it('keeps polling on pending until approved', async () => {
    const poll = vi
      .fn()
      .mockResolvedValueOnce({ status: 'pending' })
      .mockResolvedValueOnce({ status: 'pending' })
      .mockResolvedValueOnce({
        status: 'approved',
        tokens: {
          access_token: 'jwt.eyJlbWFpbCI6InVAZXhhbXBsZS5jb20ifQ.sig',
          refresh_token: 'r',
          expires_in: 3600,
        },
      })
    const deps = makeDeps({ pollDeviceCode: poll })
    await runAuth(deps)
    expect(poll).toHaveBeenCalledTimes(3)
  })

  it('doubles interval on slow_down', async () => {
    const poll = vi
      .fn()
      .mockResolvedValueOnce({ status: 'slow_down' })
      .mockResolvedValueOnce({
        status: 'approved',
        tokens: {
          access_token: 'jwt.eyJlbWFpbCI6InVAZXhhbXBsZS5jb20ifQ.sig',
          refresh_token: 'r',
          expires_in: 3600,
        },
      })
    const sleep = vi.fn(async () => {})
    const deps = makeDeps({ pollDeviceCode: poll, sleep })
    await runAuth(deps)
    expect(sleep).toHaveBeenNthCalledWith(1, 1000)
    expect(sleep).toHaveBeenNthCalledWith(2, 2000)
  })
})

describe('runLogout', () => {
  it('calls deleteCredentials and logs', async () => {
    const deleteCreds = vi.fn(async () => {})
    const log = vi.fn()
    await runLogout(deleteCreds, log)
    expect(deleteCreds).toHaveBeenCalledOnce()
    expect(log).toHaveBeenCalledWith('Signed out.')
  })
})

describe('runWhoami', () => {
  it('prints email when signed in', async () => {
    const read = async (): Promise<Credentials | null> => ({
      access_token: 'a',
      refresh_token: 'r',
      expires_at: new Date().toISOString(),
      email: 'user@example.com',
    })
    const log = vi.fn()
    await runWhoami(read, log)
    expect(log).toHaveBeenCalledWith('user@example.com')
  })

  it('prints not-signed-in message and sets exit code when no creds', async () => {
    const log = vi.fn()
    await runWhoami(async () => null, log)
    expect(log).toHaveBeenCalledWith('Not signed in. Run `forme-mcp auth` to sign in.')
    expect(process.exitCode).toBe(1)
    process.exitCode = 0
  })
})
