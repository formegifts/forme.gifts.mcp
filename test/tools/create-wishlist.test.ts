import { describe, expect, it } from 'vitest'
import { createWishlist } from '../../src/tools/create-wishlist'
import type { ToolContext } from '../../src/tools/with-auth'

const makeClient = (row: unknown, error: unknown = null) => {
  const calls: Array<{ method: string; args: unknown[] }> = []
  const builder = {
    insert: (...args: unknown[]) => {
      calls.push({ method: 'insert', args })
      return builder
    },
    select: (...args: unknown[]) => {
      calls.push({ method: 'select', args })
      return builder
    },
    single: (...args: unknown[]) => {
      calls.push({ method: 'single', args })
      return Promise.resolve({ data: row, error })
    },
  }
  const client = {
    from: (table: string) => {
      calls.push({ method: 'from', args: [table] })
      return builder
    },
  }
  return { client: client as never, calls }
}

describe('create_wishlist', () => {
  it('inserts a wishlist with name + description + event_date and returns the row', async () => {
    const created = {
      id: 'w1',
      user_id: 'u1',
      name: 'Birthday',
      description: 'Spring 2026',
      event_date: '2026-05-15',
      position: 0,
      disabled: false,
      created_at: '2026-04-30T00:00:00Z',
      updated_at: '2026-04-30T00:00:00Z',
    }
    const { client, calls } = makeClient(created)
    const ctx: ToolContext = { client }
    const result = await createWishlist(
      { name: 'Birthday', description: 'Spring 2026', event_date: '2026-05-15' },
      ctx
    )
    expect(calls[0]).toEqual({ method: 'from', args: ['wishlists'] })
    expect(calls[1].method).toBe('insert')
    expect(calls[1].args[0]).toEqual({
      name: 'Birthday',
      description: 'Spring 2026',
      event_date: '2026-05-15',
    })
    expect(result).toEqual(created)
  })

  it('inserts with only name; omits undefined optional fields', async () => {
    const created = {
      id: 'w2',
      user_id: 'u1',
      name: 'Quick',
      description: null,
      event_date: null,
      position: 0,
      disabled: false,
      created_at: '2026-04-30T00:00:00Z',
      updated_at: '2026-04-30T00:00:00Z',
    }
    const { client, calls } = makeClient(created)
    await createWishlist({ name: 'Quick' }, { client })
    expect(calls[1].args[0]).toEqual({ name: 'Quick' })
  })

  it('throws via mapSupabaseError on supabase error', async () => {
    const { client } = makeClient(null, { code: '23502', message: 'null violation' })
    await expect(createWishlist({ name: 'x' }, { client })).rejects.toMatchObject({
      code: 'invalid_argument',
    })
  })
})
