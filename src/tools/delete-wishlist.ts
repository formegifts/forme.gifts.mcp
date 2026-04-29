import { z } from 'zod'
import { McpToolError, mapSupabaseError } from '../errors'
import type { ToolHandler } from './with-auth'

export const deleteWishlistInput = z
  .object({
    id: z.string().uuid(),
    confirm: z.literal(true).optional(),
  })
  .strict()
export type DeleteWishlistInput = z.infer<typeof deleteWishlistInput>
export type DeleteWishlistOutput = { deleted: true; id: string }

export const deleteWishlist: ToolHandler<DeleteWishlistInput, DeleteWishlistOutput> = async (
  input,
  { client }
) => {
  if (input.confirm !== true) {
    const { data: wishlist } = await client
      .from('wishlists')
      .select('id, name, gifts(count)')
      .eq('id', input.id)
      .single()
    if (!wishlist) {
      throw new McpToolError('invalid_argument', `No wishlist found for id=${input.id}.`, false)
    }
    const row = wishlist as { name: string; gifts?: Array<{ count: number }> | null }
    const giftCount = row.gifts?.[0]?.count ?? 0
    throw new McpToolError(
      'failed_precondition',
      `Would delete wishlist "${row.name}" (${giftCount} gifts). Pass \`confirm: true\` to proceed.`,
      false
    )
  }

  const { error } = await client.from('wishlists').delete().eq('id', input.id)
  if (error) throw mapSupabaseError(error)
  return { deleted: true, id: input.id }
}
