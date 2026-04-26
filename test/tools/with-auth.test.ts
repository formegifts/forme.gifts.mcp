import { describe, expect, it, vi } from 'vitest'
import { SessionEndedError } from '../../src/auth/refresh'
import { McpToolError } from '../../src/errors'
import { withAuth, type WithAuthDeps } from '../../src/tools/with-auth'

const okDeps = (token = 'live'): WithAuthDeps => ({
  refreshIfNeeded: async () => token,
  createClient: () => ({ marker: 'client' }) as unknown as never,
})

describe('withAuth', () => {
  it('passes refreshed token + client to handler and returns success result', async () => {
    const handler = vi.fn(async (input: { x: number }) => ({ doubled: input.x * 2 }))
    const wrapped = withAuth(handler, okDeps('jwt'))
    const result = await wrapped({ x: 3 })
    expect(handler).toHaveBeenCalledWith({ x: 3 }, { client: { marker: 'client' } })
    expect(result.isError).toBeFalsy()
    expect(result.structuredContent).toEqual({ doubled: 6 })
    expect(result.content[0]).toEqual({ type: 'text', text: JSON.stringify({ doubled: 6 }) })
  })

  it('returns unauthenticated tool error on SessionEndedError', async () => {
    const wrapped = withAuth(async () => ({}), {
      refreshIfNeeded: async () => {
        throw new SessionEndedError()
      },
      createClient: () => ({}) as never,
    })
    const result = await wrapped({})
    expect(result.isError).toBe(true)
    const payload = result.structuredContent as { code: string; message: string; retryable: boolean }
    expect(payload.code).toBe('unauthenticated')
    expect(payload.retryable).toBe(false)
    expect(payload.message).toMatch(/sign in/i)
  })

  it('preserves McpToolError code/message/retryable', async () => {
    const wrapped = withAuth(
      async () => {
        throw new McpToolError('permission_denied', 'no access', false)
      },
      okDeps()
    )
    const result = await wrapped({})
    expect(result.isError).toBe(true)
    expect(result.structuredContent).toEqual({
      code: 'permission_denied',
      message: 'no access',
      retryable: false,
    })
  })

  it('maps unknown error via mapSupabaseError', async () => {
    const wrapped = withAuth(
      async () => {
        throw { code: '42501', message: 'denied' }
      },
      okDeps()
    )
    const result = await wrapped({})
    expect(result.structuredContent).toMatchObject({ code: 'permission_denied' })
  })
})
