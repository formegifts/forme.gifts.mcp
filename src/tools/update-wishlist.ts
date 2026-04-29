import { z } from 'zod'
import { McpToolError, mapSupabaseError } from '../errors'
import { wishlistSchema } from '../schemas/wishlist'
import { WISHLIST_COLUMNS, type WishlistRow } from '../supabase-types'
import { omitEmpty } from './omit-empty'
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
  const { id, ...rest } = input
  const patch = omitEmpty(rest)

  if (Object.keys(patch).length === 0) {
    throw new McpToolError('invalid_argument', 'Provide at least one field to update.', false)
  }

  const { data, error } = await client
    .from('wishlists')
    .update(patch)
    .eq('id', id)
    .select(WISHLIST_COLUMNS)
    .single()
  if (error) throw mapSupabaseError(error)
  return data as WishlistRow
}
