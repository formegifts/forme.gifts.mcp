import { describe, expect, it } from 'vitest'
import { createGift, createGiftInput } from '../../src/tools/create-gift'
import type { ToolContext } from '../../src/tools/with-auth'

type Call = { method: string; args: unknown[] }

const makeClient = (opts: {
  rpcResult?: { data: unknown; error: unknown }
  selectResult?: { data: unknown; error: unknown }
}) => {
  const calls: Call[] = []
  const selectBuilder = {
    select: (...a: unknown[]) => {
      calls.push({ method: 'select', args: a })
      return selectBuilder
    },
    eq: (...a: unknown[]) => {
      calls.push({ method: 'eq', args: a })
      return selectBuilder
    },
    single: () => {
      calls.push({ method: 'single', args: [] })
      return Promise.resolve(opts.selectResult ?? { data: null, error: null })
    },
  }
  const client = {
    rpc: (...a: unknown[]) => {
      calls.push({ method: 'rpc', args: a })
      return Promise.resolve(opts.rpcResult ?? { data: null, error: null })
    },
    from: (t: string) => {
      calls.push({ method: 'from', args: [t] })
      return selectBuilder
    },
  }
  return { client: client as never, calls }
}

const giftRow = {
  id: 'g1',
  wishlist_id: 'w1',
  name: 'Moka pot',
  description: '6-cup',
  product_link: 'https://example.com/moka',
  price_min: 30,
  price_max: 50,
  position: 0,
  image_urls: ['https://img.example/1.jpg'],
  created_at: '2026-04-30T00:00:00Z',
  updated_at: '2026-04-30T00:00:00Z',
}

describe('create_gift', () => {
  it('calls create_gift RPC with all p_-prefixed fields, then returns the fetched row', async () => {
    const { client, calls } = makeClient({
      rpcResult: { data: 'g1', error: null },
      selectResult: { data: giftRow, error: null },
    })
    const ctx: ToolContext = { client }
    const result = await createGift(
      {
        wishlist_id: 'w1',
        name: 'Moka pot',
        description: '6-cup',
        product_link: 'https://example.com/moka',
        price_min: 30,
        price_max: 50,
        image_urls: ['https://img.example/1.jpg'],
      },
      ctx
    )
    expect(calls[0]).toEqual({
      method: 'rpc',
      args: [
        'create_gift',
        {
          p_wishlist_id: 'w1',
          p_name: 'Moka pot',
          p_description: '6-cup',
          p_product_link: 'https://example.com/moka',
          p_price_min: 30,
          p_price_max: 50,
          p_image_urls: ['https://img.example/1.jpg'],
        },
      ],
    })
    expect(calls[1]).toEqual({ method: 'from', args: ['gifts'] })
    expect(calls.find((c) => c.method === 'eq')).toEqual({ method: 'eq', args: ['id', 'g1'] })
    expect(result).toEqual(giftRow)
  })

  it('omits unset optional fields from the RPC params', async () => {
    const { client, calls } = makeClient({
      rpcResult: { data: 'g2', error: null },
      selectResult: { data: { ...giftRow, id: 'g2' }, error: null },
    })
    await createGift({ wishlist_id: 'w1', name: 'TBD' }, { client } as ToolContext)
    expect(calls[0]).toEqual({
      method: 'rpc',
      args: ['create_gift', { p_wishlist_id: 'w1', p_name: 'TBD' }],
    })
  })

  it('throws via mapSupabaseError when the RPC returns an error', async () => {
    const { client } = makeClient({
      rpcResult: { data: null, error: { code: '53400', message: 'Gift limit reached' } },
    })
    await expect(
      createGift({ wishlist_id: 'w1', name: 'x' }, { client } as ToolContext)
    ).rejects.toMatchObject({ code: 'resource_exhausted', retryable: false })
  })

  it('throws failed_precondition when the RPC returns a non-string id', async () => {
    const { client } = makeClient({ rpcResult: { data: null, error: null } })
    await expect(
      createGift({ wishlist_id: 'w1', name: 'x' }, { client } as ToolContext)
    ).rejects.toMatchObject({ code: 'failed_precondition', retryable: false })
  })

  it('rejects more than 5 image_urls at the schema level', () => {
    const tooMany = Array.from({ length: 6 }, (_, i) => `https://img.example/${i}.jpg`)
    const parsed = createGiftInput.safeParse({
      wishlist_id: '00000000-0000-0000-0000-000000000000',
      name: 'x',
      image_urls: tooMany,
    })
    expect(parsed.success).toBe(false)
  })
})
