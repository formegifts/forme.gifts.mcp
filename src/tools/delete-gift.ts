import { z } from 'zod'
import { McpToolError, mapSupabaseError } from '../errors'
import type { ToolHandler } from './with-auth'

export const deleteGiftInput = z
  .object({
    id: z.string().uuid(),
    confirm: z.literal(true).optional(),
  })
  .strict()
export type DeleteGiftInput = z.infer<typeof deleteGiftInput>
export type DeleteGiftOutput = { deleted: true; id: string }

export const deleteGift: ToolHandler<DeleteGiftInput, DeleteGiftOutput> = async (
  input,
  { client }
) => {
  if (input.confirm !== true) {
    const { data: gift } = await client.from('gifts').select('id, name').eq('id', input.id).single()
    if (!gift) {
      throw new McpToolError('invalid_argument', `No gift found for id=${input.id}.`, false)
    }
    throw new McpToolError(
      'failed_precondition',
      `Would delete gift "${(gift as { name: string }).name}". Pass \`confirm: true\` to proceed.`,
      false
    )
  }

  const { error } = await client.from('gifts').delete().eq('id', input.id)
  if (error) throw mapSupabaseError(error)
  return { deleted: true, id: input.id }
}
