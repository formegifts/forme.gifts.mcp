import { describe, expect, it } from 'vitest'
import { deleteGift } from '../../src/tools/delete-gift'
import type { ToolContext } from '../../src/tools/with-auth'

const makeClient = (responses: Array<{ data?: unknown; error?: unknown }>) => {
  const calls: Array<{ method: string; args: unknown[] }> = []
  let cursor = 0
  const next = () => Promise.resolve(responses[cursor++] ?? { data: null, error: null })
  const builder: Record<string, unknown> = {
    select: (...a: unknown[]) => { calls.push({ method: 'select', args: a }); return builder },
    eq: (...a: unknown[]) => { calls.push({ method: 'eq', args: a }); return builder },
    single: () => { calls.push({ method: 'single', args: [] }); return next() },
  }
  const eqDelete = {
    eq: (...a: unknown[]) => { calls.push({ method: 'eq', args: a }); return next() },
  }
  const realBuilder = {
    ...builder,
    delete: (...a: unknown[]) => { calls.push({ method: 'delete', args: a }); return eqDelete },
  }
  const client = { from: (t: string) => { calls.push({ method: 'from', args: [t] }); return realBuilder } }
  return { client: client as never, calls }
}

describe('delete_gift', () => {
  it('returns failed_precondition with dry-run summary when confirm is missing', async () => {
    const { client } = makeClient([{ data: { id: 'g1', name: 'Moka pot' } }])
    const ctx: ToolContext = { client }
    await expect(deleteGift({ id: 'g1' }, ctx)).rejects.toMatchObject({
      code: 'failed_precondition',
      message: expect.stringMatching(/Moka pot.*confirm: true/i),
    })
  })

  it('executes delete and returns { deleted: true, id } when confirm is true', async () => {
    const { client, calls } = makeClient([{ error: null }])
    const result = await deleteGift({ id: 'g1', confirm: true }, { client })
    expect(calls[1]).toEqual({ method: 'delete', args: [] })
    expect(calls[2]).toEqual({ method: 'eq', args: ['id', 'g1'] })
    expect(result).toEqual({ deleted: true, id: 'g1' })
  })

  it('throws invalid_argument when gift not found in dry-run', async () => {
    const { client } = makeClient([{ data: null }])
    await expect(deleteGift({ id: 'gX' }, { client })).rejects.toMatchObject({
      code: 'invalid_argument',
    })
  })
})
