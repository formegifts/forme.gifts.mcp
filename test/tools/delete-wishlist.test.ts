import { describe, expect, it } from 'vitest'
import { deleteWishlist } from '../../src/tools/delete-wishlist'
import type { ToolContext } from '../../src/tools/with-auth'

const makeClient = (responses: Array<{ data?: unknown; error?: unknown }>) => {
  const calls: Array<{ method: string; args: unknown[] }> = []
  let cursor = 0
  const next = () => Promise.resolve(responses[cursor++] ?? { data: null, error: null })
  const builder: Record<string, unknown> = {
    select: (...a: unknown[]) => { calls.push({ method: 'select', args: a }); return builder },
    eq: (...a: unknown[]) => { calls.push({ method: 'eq', args: a }); return builder },
    delete: (...a: unknown[]) => { calls.push({ method: 'delete', args: a }); return builder },
    single: () => { calls.push({ method: 'single', args: [] }); return next() },
  }
  // for delete().eq() the chain ends at eq() — return a thenable
  const eqDelete = {
    eq: (...a: unknown[]) => { calls.push({ method: 'eq', args: a }); return next() },
  }
  // when delete is called, swap the eq behavior to terminal
  const realBuilder = {
    ...builder,
    delete: (...a: unknown[]) => { calls.push({ method: 'delete', args: a }); return eqDelete },
  }
  const client = {
    from: (t: string) => { calls.push({ method: 'from', args: [t] }); return realBuilder },
  }
  return { client: client as never, calls }
}

describe('delete_wishlist', () => {
  it('returns failed_precondition with dry-run summary when confirm is missing', async () => {
    // Single combined read via gifts(count) join
    const { client, calls } = makeClient([
      { data: { id: 'w1', name: 'Kitchen', gifts: [{ count: 7 }] } },
    ])
    const ctx: ToolContext = { client }
    await expect(deleteWishlist({ id: 'w1' }, ctx)).rejects.toMatchObject({
      code: 'failed_precondition',
      message: expect.stringMatching(/Kitchen.*7 gifts.*confirm: true/i),
    })
    // No delete should have been called
    expect(calls.find((c) => c.method === 'delete')).toBeUndefined()
  })

  it('executes delete and returns { deleted: true, id } when confirm is true', async () => {
    const { client, calls } = makeClient([{ error: null }])
    const result = await deleteWishlist({ id: 'w1', confirm: true }, { client })
    expect(calls[0]).toEqual({ method: 'from', args: ['wishlists'] })
    expect(calls[1]).toEqual({ method: 'delete', args: [] })
    expect(calls[2]).toEqual({ method: 'eq', args: ['id', 'w1'] })
    expect(result).toEqual({ deleted: true, id: 'w1' })
  })

  it('throws invalid_argument when wishlist not found in dry-run', async () => {
    const { client } = makeClient([{ data: null }])
    await expect(deleteWishlist({ id: 'wX' }, { client })).rejects.toMatchObject({
      code: 'invalid_argument',
    })
  })
})
