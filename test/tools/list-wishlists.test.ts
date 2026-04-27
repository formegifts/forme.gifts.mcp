import { describe, expect, it } from 'vitest'
import { listWishlists } from '../../src/tools/list-wishlists'
import type { ToolContext } from '../../src/tools/with-auth'

type CallLog = { method: string; args: unknown[] }

const makeClient = (rows: unknown, error: unknown = null) => {
  const calls: CallLog[] = []
  const builder = {
    select: (...args: unknown[]) => {
      calls.push({ method: 'select', args })
      return builder
    },
    eq: (...args: unknown[]) => {
      calls.push({ method: 'eq', args })
      return builder
    },
    order: (...args: unknown[]) => {
      calls.push({ method: 'order', args })
      return Promise.resolve({ data: rows, error })
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

describe('list_wishlists', () => {
  it('queries wishlists with gift count, excludes disabled, orders desc', async () => {
    const { client, calls } = makeClient([
      {
        id: 'w1',
        name: 'Kitchen',
        description: null,
        event_date: null,
        updated_at: '2026-04-25T00:00:00Z',
        gifts: [{ count: 3 }],
      },
    ])
    const ctx: ToolContext = { client }
    const result = await listWishlists({}, ctx)
    expect(calls[0]).toEqual({ method: 'from', args: ['wishlists'] })
    expect(calls[1].method).toBe('select')
    expect(calls[1].args[0]).toContain('gifts(count)')
    expect(calls[2]).toEqual({ method: 'eq', args: ['disabled', false] })
    expect(calls[3]).toEqual({ method: 'order', args: ['updated_at', { ascending: false }] })
    expect(result).toEqual({
      wishlists: [
        {
          id: 'w1',
          name: 'Kitchen',
          description: null,
          event_date: null,
          gift_count: 3,
          updated_at: '2026-04-25T00:00:00Z',
        },
      ],
    })
  })

  it('treats missing gifts aggregate as 0', async () => {
    const { client } = makeClient([
      {
        id: 'w2',
        name: 'Empty',
        description: 'd',
        event_date: '2026-12-25',
        updated_at: '2026-04-26T00:00:00Z',
        gifts: [],
      },
    ])
    const result = await listWishlists({}, { client })
    expect(result.wishlists[0].gift_count).toBe(0)
  })

  it('throws via mapSupabaseError when supabase returns an error', async () => {
    const { client } = makeClient(null, { code: '42501', message: 'denied' })
    await expect(listWishlists({}, { client })).rejects.toMatchObject({ code: 'permission_denied' })
  })
})
