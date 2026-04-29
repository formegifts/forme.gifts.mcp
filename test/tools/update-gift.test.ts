import { describe, expect, it } from 'vitest'
import { updateGift } from '../../src/tools/update-gift'
import type { ToolContext } from '../../src/tools/with-auth'

const makeClient = (row: unknown, error: unknown = null) => {
  const calls: Array<{ method: string; args: unknown[] }> = []
  const builder = {
    update: (...a: unknown[]) => { calls.push({ method: 'update', args: a }); return builder },
    eq: (...a: unknown[]) => { calls.push({ method: 'eq', args: a }); return builder },
    select: (...a: unknown[]) => { calls.push({ method: 'select', args: a }); return builder },
    single: () => { calls.push({ method: 'single', args: [] }); return Promise.resolve({ data: row, error }) },
  }
  const client = { from: (t: string) => { calls.push({ method: 'from', args: [t] }); return builder } }
  return { client: client as never, calls }
}

describe('update_gift', () => {
  it('updates only provided fields by id', async () => {
    const updated = {
      id: 'g1',
      wishlist_id: 'w1',
      name: 'Renamed',
      description: 'still here',
      product_link: null,
      price_min: null,
      price_max: null,
      position: 0,
      image_urls: null,
      created_at: '2026-04-01T00:00:00Z',
      updated_at: '2026-04-30T00:00:00Z',
    }
    const { client, calls } = makeClient(updated)
    const ctx: ToolContext = { client }
    const result = await updateGift({ id: 'g1', name: 'Renamed' }, ctx)
    expect(calls[0]).toEqual({ method: 'from', args: ['gifts'] })
    expect(calls[1]).toEqual({ method: 'update', args: [{ name: 'Renamed' }] })
    expect(calls[2]).toEqual({ method: 'eq', args: ['id', 'g1'] })
    expect(result).toEqual(updated)
  })

  it('throws invalid_argument when no fields besides id', async () => {
    const { client } = makeClient(null)
    await expect(updateGift({ id: 'g1' }, { client })).rejects.toMatchObject({
      code: 'invalid_argument',
    })
  })
})
