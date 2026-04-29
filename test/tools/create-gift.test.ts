import { describe, expect, it } from 'vitest'
import { createGift, createGiftInput } from '../../src/tools/create-gift'
import type { ToolContext } from '../../src/tools/with-auth'

const makeClient = (row: unknown, error: unknown = null) => {
  const calls: Array<{ method: string; args: unknown[] }> = []
  const builder = {
    insert: (...a: unknown[]) => { calls.push({ method: 'insert', args: a }); return builder },
    select: (...a: unknown[]) => { calls.push({ method: 'select', args: a }); return builder },
    single: () => { calls.push({ method: 'single', args: [] }); return Promise.resolve({ data: row, error }) },
  }
  const client = { from: (t: string) => { calls.push({ method: 'from', args: [t] }); return builder } }
  return { client: client as never, calls }
}

describe('create_gift', () => {
  it('inserts a gift with all fields and returns the row', async () => {
    const created = {
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
    const { client, calls } = makeClient(created)
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
    expect(calls[0]).toEqual({ method: 'from', args: ['gifts'] })
    expect(calls[1].method).toBe('insert')
    expect(calls[1].args[0]).toMatchObject({
      wishlist_id: 'w1',
      name: 'Moka pot',
      product_link: 'https://example.com/moka',
      price_min: 30,
      price_max: 50,
      image_urls: ['https://img.example/1.jpg'],
    })
    expect(result).toEqual(created)
  })

  it('inserts with only wishlist_id + name; omits unset optional fields', async () => {
    const created = {
      id: 'g2',
      wishlist_id: 'w1',
      name: 'TBD',
      description: null,
      product_link: null,
      price_min: null,
      price_max: null,
      position: 0,
      image_urls: null,
      created_at: '2026-04-30T00:00:00Z',
      updated_at: '2026-04-30T00:00:00Z',
    }
    const { client, calls } = makeClient(created)
    await createGift({ wishlist_id: 'w1', name: 'TBD' }, { client })
    expect(calls[1].args[0]).toEqual({ wishlist_id: 'w1', name: 'TBD' })
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
