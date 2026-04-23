import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeCredentials, readCredentials } from '../../src/auth/credentials'
import { refreshIfNeeded, SessionEndedError } from '../../src/auth/refresh'

describe('refreshIfNeeded', () => {
  let tmp: string

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'forme-refresh-'))
    process.env.XDG_CONFIG_HOME = tmp
    vi.restoreAllMocks()
  })

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true })
    delete process.env.XDG_CONFIG_HOME
    vi.restoreAllMocks()
  })

  it('returns the existing access_token when expires_at is far in the future', async () => {
    await writeCredentials({
      access_token: 'live-token',
      refresh_token: 'r',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      email: 'u@example.com',
    })
    const token = await refreshIfNeeded()
    expect(token).toBe('live-token')
  })

  it('refreshes when expires_at is within 60s', async () => {
    await writeCredentials({
      access_token: 'old',
      refresh_token: 'r1',
      expires_at: new Date(Date.now() + 30 * 1000).toISOString(),
      email: 'u@example.com',
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: 'new',
          refresh_token: 'r2',
          token_type: 'bearer',
          expires_in: 3600,
        }),
        { status: 200 }
      )
    )
    const token = await refreshIfNeeded()
    expect(token).toBe('new')
    const creds = await readCredentials()
    expect(creds?.access_token).toBe('new')
    expect(creds?.refresh_token).toBe('r2')
  })

  it('throws SessionEndedError and deletes credentials on invalid_grant', async () => {
    await writeCredentials({
      access_token: 'old',
      refresh_token: 'stale',
      expires_at: new Date(Date.now() - 60 * 1000).toISOString(),
      email: 'u@example.com',
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ error: 'invalid_grant', error_description: 'revoked' }),
        { status: 400 }
      )
    )
    await expect(refreshIfNeeded()).rejects.toBeInstanceOf(SessionEndedError)
    expect(await readCredentials()).toBeNull()
  })

  it('throws SessionEndedError when no credentials file exists', async () => {
    await expect(refreshIfNeeded()).rejects.toBeInstanceOf(SessionEndedError)
  })
})
