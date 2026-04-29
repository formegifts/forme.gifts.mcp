import { z } from 'zod'
import { McpToolError, mapSupabaseError } from '../errors'
import { wishlistSchema } from '../schemas/wishlist'
import { WISHLIST_COLUMNS, type WishlistRow } from '../supabase-types'
import type { ToolHandler } from './with-auth'

export const updateWishlistInput = wishlistSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  })
  .strict()
export type UpdateWishlistInput = z.infer<typeof updateWishlistInput>
export type UpdateWishlistOutput = WishlistRow

export const updateWishlist: ToolHandler<UpdateWishlistInput, UpdateWishlistOutput> = async (
  input,
  { client }
) => {
  const patch: Record<string, unknown> = {}
  if (input.name !== undefined) patch.name = input.name
  if (input.description !== undefined && input.description !== '')
    patch.description = input.description
  if (input.event_date !== undefined && input.event_date !== '') patch.event_date = input.event_date

  if (Object.keys(patch).length === 0) {
    throw new McpToolError('invalid_argument', 'Provide at least one field to update.', false)
  }

  const { data, error } = await client
    .from('wishlists')
    .update(patch)
    .eq('id', input.id)
    .select(WISHLIST_COLUMNS)
    .single()
  if (error) throw mapSupabaseError(error)
  return data as WishlistRow
}
