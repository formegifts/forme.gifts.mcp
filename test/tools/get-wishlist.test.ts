import { describe, expect, it } from 'vitest'
import { getWishlist } from '../../src/tools/get-wishlist'

type CallLog = { method: string; args: unknown[] }

const makeClient = (row: unknown, error: unknown = null) => {
  const calls: CallLog[] = []
  const giftBuilder = {
    select: (...args: unknown[]) => {
      calls.push({ method: 'gifts.select', args })
      return giftBuilder
    },
    eq: (...args: unknown[]) => {
      calls.push({ method: 'gifts.eq', args })
      return giftBuilder
    },
    order: (...args: unknown[]) => {
      calls.push({ method: 'gifts.order', args })
      return Promise.resolve({ data: [], error: null })
    },
  }
  const wishlistBuilder = {
    select: (...args: unknown[]) => {
      calls.push({ method: 'wishlists.select', args })
      return wishlistBuilder
    },
    eq: (...args: unknown[]) => {
      calls.push({ method: 'wishlists.eq', args })
      return wishlistBuilder
    },
    maybeSingle: () => {
      calls.push({ method: 'wishlists.maybeSingle', args: [] })
      return Promise.resolve({ data: row, error })
    },
  }
  const client = {
    from: (table: string) => {
      calls.push({ method: 'from', args: [table] })
      return table === 'gifts' ? giftBuilder : wishlistBuilder
    },
  }
  return { client: client as never, calls, giftBuilder }
}

describe('get_wishlist', () => {
  it('rejects when neither id nor name supplied', async () => {
    const { client } = makeClient(null)
    await expect(getWishlist({} as never, { client })).rejects.toMatchObject({
      code: 'invalid_argument',
    })
  })

  it('rejects when both id and name supplied', async () => {
    const { client } = makeClient(null)
    await expect(
      getWishlist({ id: '00000000-0000-0000-0000-000000000000', name: 'X' } as never, { client })
    ).rejects.toMatchObject({ code: 'invalid_argument' })
  })

  it('fetches by id and returns wishlist + gifts', async () => {
    const wishlist = {
      id: 'w1',
      name: 'Kitchen',
      description: null,
      event_date: null,
      position: 0,
      disabled: false,
      created_at: '2026-04-01T00:00:00Z',
      updated_at: '2026-04-25T00:00:00Z',
      user_id: 'u1',
    }
    const { client, calls, giftBuilder } = makeClient(wishlist)
    const giftRows = [
      {
        id: 'g1',
        wishlist_id: 'w1',
        name: 'Moka pot',
        description: null,
        product_link: null,
        price_min: null,
        price_max: null,
        position: 0,
        image_urls: [],
        created_at: '2026-04-01T00:00:00Z',
        updated_at: '2026-04-01T00:00:00Z',
      },
    ]
    giftBuilder.order = () => Promise.resolve({ data: giftRows, error: null })

    const result = await getWishlist({ id: 'w1' }, { client })
    expect(result).toMatchObject({
      id: 'w1',
      name: 'Kitchen',
      gifts: [expect.objectContaining({ id: 'g1', name: 'Moka pot' })],
    })
    expect(calls.find((c) => c.method === 'wishlists.eq')).toMatchObject({ args: ['id', 'w1'] })
  })

  it('fetches by name when only name supplied', async () => {
    const wishlist = {
      id: 'w2',
      name: 'Birthday',
      description: null,
      event_date: null,
      position: 1,
      disabled: false,
      created_at: '2026-04-01T00:00:00Z',
      updated_at: '2026-04-25T00:00:00Z',
      user_id: 'u1',
    }
    const { client, calls } = makeClient(wishlist)
    await getWishlist({ name: 'Birthday' }, { client })
    expect(calls.find((c) => c.method === 'wishlists.eq')).toMatchObject({
      args: ['name', 'Birthday'],
    })
  })

  it('returns invalid_argument when no row matches', async () => {
    const { client } = makeClient(null)
    await expect(
      getWishlist({ id: '00000000-0000-0000-0000-000000000000' }, { client })
    ).rejects.toMatchObject({ code: 'invalid_argument' })
  })

  it('maps supabase error', async () => {
    const { client } = makeClient(null, { code: '42501', message: 'denied' })
    await expect(
      getWishlist({ id: '00000000-0000-0000-0000-000000000000' }, { client })
    ).rejects.toMatchObject({ code: 'permission_denied' })
  })
})
