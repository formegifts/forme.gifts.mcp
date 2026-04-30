import { describe, expect, it } from 'vitest'
import { mapSupabaseError, McpToolError } from '../src/errors'

describe('McpToolError', () => {
  it('carries code, message, retryable', () => {
    const err = new McpToolError('permission_denied', 'no access', false)
    expect(err.code).toBe('permission_denied')
    expect(err.message).toBe('no access')
    expect(err.retryable).toBe(false)
    expect(err).toBeInstanceOf(Error)
  })
})

describe('mapSupabaseError', () => {
  it('maps RLS denial (42501) to permission_denied', () => {
    const err = mapSupabaseError({ code: '42501', message: 'permission denied for table wishlists' })
    expect(err.code).toBe('permission_denied')
    expect(err.retryable).toBe(false)
    expect(err.message).toMatch(/permission denied/i)
  })

  it('maps PGRST116 (no rows) to invalid_argument', () => {
    const err = mapSupabaseError({
      code: 'PGRST116',
      message: 'JSON object requested, multiple (or no) rows returned',
    })
    expect(err.code).toBe('invalid_argument')
    expect(err.retryable).toBe(false)
  })

  it('maps not-null violation (23502) to invalid_argument', () => {
    const err = mapSupabaseError({ code: '23502', message: 'null value in column' })
    expect(err.code).toBe('invalid_argument')
  })

  it('maps check violation (23514) to invalid_argument', () => {
    const err = mapSupabaseError({ code: '23514', message: 'check constraint violated' })
    expect(err.code).toBe('invalid_argument')
  })

  it('maps configuration_limit_exceeded (53400) to resource_exhausted', () => {
    const err = mapSupabaseError({
      code: '53400',
      message: 'Wishlist limit reached (1 allowed on your plan)',
    })
    expect(err.code).toBe('resource_exhausted')
    expect(err.retryable).toBe(false)
    expect(err.message).toMatch(/limit reached/i)
  })

  it('maps RPC RAISE EXCEPTION (P0001) errors to failed_precondition', () => {
    const err = mapSupabaseError({ code: 'P0001', message: 'Wishlist name is required' })
    expect(err.code).toBe('failed_precondition')
    expect(err.retryable).toBe(false)
  })

  it('maps non-JWT HTTP 401 to unauthenticated, preserving original message', () => {
    const err = mapSupabaseError({ status: 401, message: 'Unauthorized' })
    expect(err.code).toBe('unauthenticated')
    expect(err.retryable).toBe(false)
    expect(err.message).toBe('Unauthorized')
  })

  it('maps "No suitable key or wrong key type" to unauthenticated with auth instructions', () => {
    const err = mapSupabaseError({ message: 'No suitable key or wrong key type' })
    expect(err.code).toBe('unauthenticated')
    expect(err.retryable).toBe(false)
    expect(err.message).toMatch(/auth_start/)
  })

  it('maps generic JWS verification failures to unauthenticated', () => {
    const err = mapSupabaseError({ message: 'jws: signature verification failed' })
    expect(err.code).toBe('unauthenticated')
    expect(err.retryable).toBe(false)
    expect(err.message).toMatch(/auth_start/)
  })

  it('maps invalid_api_key code to failed_precondition with config-pointing message', () => {
    const err = mapSupabaseError({
      status: 401,
      code: 'invalid_api_key',
      message: 'Invalid API key',
    })
    expect(err.code).toBe('failed_precondition')
    expect(err.retryable).toBe(false)
    expect(err.message).toMatch(/FORME_SUPABASE_ANON_KEY/)
  })

  it('maps "Invalid API key" message-only to failed_precondition (no code field)', () => {
    const err = mapSupabaseError({ status: 401, message: 'Invalid API key' })
    expect(err.code).toBe('failed_precondition')
    expect(err.retryable).toBe(false)
  })

  it('maps network failure to unavailable retryable', () => {
    const err = mapSupabaseError({ message: 'fetch failed' })
    expect(err.code).toBe('unavailable')
    expect(err.retryable).toBe(true)
  })

  it('falls back to unavailable retryable for unknown shapes', () => {
    const err = mapSupabaseError({ code: 'whatever', message: 'unexpected' })
    expect(err.code).toBe('unavailable')
    expect(err.retryable).toBe(true)
  })

  it('passes McpToolError through unchanged', () => {
    const original = new McpToolError('failed_precondition', 'custom', false)
    expect(mapSupabaseError(original)).toBe(original)
  })
})
