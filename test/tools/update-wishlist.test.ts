import { describe, expect, it } from 'vitest'
import { updateWishlist } from '../../src/tools/update-wishlist'
import type { ToolContext } from '../../src/tools/with-auth'

const makeClient = (row: unknown, error: unknown = null) => {
  const calls: Array<{ method: string; args: unknown[] }> = []
  const builder = {
    update: (...args: unknown[]) => { calls.push({ method: 'update', args }); return builder },
    eq: (...args: unknown[]) => { calls.push({ method: 'eq', args }); return builder },
    select: (...args: unknown[]) => { calls.push({ method: 'select', args }); return builder },
    single: (...args: unknown[]) => { calls.push({ method: 'single', args }); return Promise.resolve({ data: row, error }) },
  }
  const client = { from: (t: string) => { calls.push({ method: 'from', args: [t] }); return builder } }
  return { client: client as never, calls }
}

describe('update_wishlist', () => {
  it('updates only provided fields by id', async () => {
    const updated = {
      id: 'w1',
      user_id: 'u1',
      name: 'Renamed',
      description: 'old',
      event_date: null,
      position: 0,
      disabled: false,
      created_at: '2026-04-01T00:00:00Z',
      updated_at: '2026-04-30T00:00:00Z',
    }
    const { client, calls } = makeClient(updated)
    const ctx: ToolContext = { client }
    const result = await updateWishlist({ id: 'w1', name: 'Renamed' }, ctx)
    expect(calls[0]).toEqual({ method: 'from', args: ['wishlists'] })
    expect(calls[1]).toEqual({ method: 'update', args: [{ name: 'Renamed' }] })
    expect(calls[2]).toEqual({ method: 'eq', args: ['id', 'w1'] })
    expect(result).toEqual(updated)
  })

  it('throws invalid_argument when no fields provided besides id', async () => {
    const { client } = makeClient(null)
    await expect(updateWishlist({ id: 'w1' }, { client })).rejects.toMatchObject({
      code: 'invalid_argument',
    })
  })

  it('passes event_date through when provided', async () => {
    const { client, calls } = makeClient({} as never)
    await updateWishlist({ id: 'w1', event_date: '2026-12-25' }, { client })
    expect(calls[1].args[0]).toEqual({ event_date: '2026-12-25' })
  })
})
