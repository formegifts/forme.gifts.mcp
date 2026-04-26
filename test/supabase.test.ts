import { describe, expect, it, vi } from 'vitest'

const createClientMock = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => {
    createClientMock(...args)
    return { _from: 'mocked' }
  },
}))

describe('createAuthedSupabaseClient', () => {
  it('passes URL, anon key, and Authorization header', async () => {
    const { createAuthedSupabaseClient } = await import('../src/supabase')
    const client = createAuthedSupabaseClient('user-jwt')
    expect(client).toBeDefined()
    expect(createClientMock).toHaveBeenCalledOnce()
    const [url, anonKey, options] = createClientMock.mock.calls[0]
    expect(typeof url).toBe('string')
    expect(typeof anonKey).toBe('string')
    expect(options.global.headers.Authorization).toBe('Bearer user-jwt')
    expect(options.auth.persistSession).toBe(false)
    expect(options.auth.autoRefreshToken).toBe(false)
  })
})
