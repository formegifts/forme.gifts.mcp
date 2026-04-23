import { describe, expect, it } from 'vitest'
import { decodeEmailFromJwt } from '../../src/auth/decode-email'

describe('decodeEmailFromJwt', () => {
  it('extracts email from a Supabase-shaped JWT', () => {
    const payload = Buffer.from(
      JSON.stringify({ sub: '123', email: 'user@example.com', role: 'authenticated' })
    ).toString('base64url')
    const jwt = `header.${payload}.signature`
    expect(decodeEmailFromJwt(jwt)).toBe('user@example.com')
  })

  it('returns null when payload is malformed', () => {
    expect(decodeEmailFromJwt('not.a.jwt!!!')).toBeNull()
  })

  it('returns null when email missing', () => {
    const payload = Buffer.from(JSON.stringify({ sub: '123' })).toString('base64url')
    expect(decodeEmailFromJwt(`h.${payload}.s`)).toBeNull()
  })
})
