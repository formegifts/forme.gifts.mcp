import { describe, expect, it } from 'vitest'
import { createWishlist } from '../../src/tools/create-wishlist'
import type { ToolContext } from '../../src/tools/with-auth'

type Call = { method: string; args: unknown[] }

const makeClient = (opts: {
  rpcResult?: { data: unknown; error: unknown }
  selectResult?: { data: unknown; error: unknown }
}) => {
  const calls: Call[] = []
  const selectBuilder = {
    select: (...args: unknown[]) => {
      calls.push({ method: 'select', args })
      return selectBuilder
    },
    eq: (...args: unknown[]) => {
      calls.push({ method: 'eq', args })
      return selectBuilder
    },
    single: (...args: unknown[]) => {
      calls.push({ method: 'single', args })
      return Promise.resolve(opts.selectResult ?? { data: null, error: null })
    },
  }
  const client = {
    rpc: (...args: unknown[]) => {
      calls.push({ method: 'rpc', args })
      return Promise.resolve(opts.rpcResult ?? { data: null, error: null })
    },
    from: (table: string) => {
      calls.push({ method: 'from', args: [table] })
      return selectBuilder
    },
  }
  return { client: client as never, calls }
}

const wishlistRow = {
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

describe('create_wishlist', () => {
  it('calls create_wishlist RPC with name + description + event_date, then returns the fetched row', async () => {
    const { client, calls } = makeClient({
      rpcResult: { data: 'w1', error: null },
      selectResult: { data: wishlistRow, error: null },
    })
    const ctx: ToolContext = { client }
    const result = await createWishlist(
      { name: 'Birthday', description: 'Spring 2026', event_date: '2026-05-15' },
      ctx
    )
    expect(calls[0]).toEqual({
      method: 'rpc',
      args: [
        'create_wishlist',
        { p_name: 'Birthday', p_description: 'Spring 2026', p_event_date: '2026-05-15' },
      ],
    })
    expect(calls[1]).toEqual({ method: 'from', args: ['wishlists'] })
    expect(calls.find((c) => c.method === 'eq')).toEqual({ method: 'eq', args: ['id', 'w1'] })
    expect(result).toEqual(wishlistRow)
  })

  it('omits empty-string and undefined optionals from the RPC params', async () => {
    const { client, calls } = makeClient({
      rpcResult: { data: 'w2', error: null },
      selectResult: { data: { ...wishlistRow, id: 'w2' }, error: null },
    })
    await createWishlist(
      { name: 'Quick', description: '', event_date: '' },
      { client } as ToolContext
    )
    expect(calls[0]).toEqual({ method: 'rpc', args: ['create_wishlist', { p_name: 'Quick' }] })
  })

  it('passes only name when optional fields are absent', async () => {
    const { client, calls } = makeClient({
      rpcResult: { data: 'w3', error: null },
      selectResult: { data: { ...wishlistRow, id: 'w3' }, error: null },
    })
    await createWishlist({ name: 'Bare' }, { client } as ToolContext)
    expect(calls[0]).toEqual({ method: 'rpc', args: ['create_wishlist', { p_name: 'Bare' }] })
  })

  it('throws via mapSupabaseError when the RPC returns an error', async () => {
    const { client } = makeClient({
      rpcResult: { data: null, error: { code: '23502', message: 'null violation' } },
    })
    await expect(createWishlist({ name: 'x' }, { client } as ToolContext)).rejects.toMatchObject({
      code: 'invalid_argument',
    })
  })

  it('throws failed_precondition when the RPC returns a non-string id', async () => {
    const { client } = makeClient({ rpcResult: { data: null, error: null } })
    await expect(createWishlist({ name: 'x' }, { client } as ToolContext)).rejects.toMatchObject({
      code: 'failed_precondition',
      retryable: false,
    })
  })

  it('throws via mapSupabaseError when the post-create select fails', async () => {
    const { client } = makeClient({
      rpcResult: { data: 'w4', error: null },
      selectResult: { data: null, error: { code: 'PGRST116', message: 'not found' } },
    })
    await expect(createWishlist({ name: 'x' }, { client } as ToolContext)).rejects.toMatchObject({
      code: 'invalid_argument',
    })
  })
})
