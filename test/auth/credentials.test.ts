import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeCredentials, readCredentials, deleteCredentials, credentialsPath } from '../../src/auth/credentials'

describe('credentials', () => {
  let tmp: string

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'forme-creds-'))
    process.env.XDG_CONFIG_HOME = tmp
  })

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true })
    delete process.env.XDG_CONFIG_HOME
  })

  it('writes credentials with chmod 600', async () => {
    await writeCredentials({
      access_token: 'a',
      refresh_token: 'r',
      expires_at: new Date().toISOString(),
      email: 'u@example.com',
    })
    const mode = statSync(credentialsPath()).mode & 0o777
    expect(mode).toBe(0o600)
  })

  it('round-trips credentials', async () => {
    const creds = {
      access_token: 'abc',
      refresh_token: 'def',
      expires_at: '2026-05-01T00:00:00.000Z',
      email: 'user@example.com',
    }
    await writeCredentials(creds)
    const read = await readCredentials()
    expect(read).toEqual(creds)
  })

  it('returns null when no credentials file exists', async () => {
    const read = await readCredentials()
    expect(read).toBeNull()
  })

  it('deletes credentials', async () => {
    await writeCredentials({
      access_token: 'a',
      refresh_token: 'r',
      expires_at: new Date().toISOString(),
      email: 'u@example.com',
    })
    await deleteCredentials()
    expect(await readCredentials()).toBeNull()
  })
})
