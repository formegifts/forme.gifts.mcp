import type { z } from 'zod'
import { mapSupabaseError } from '../errors'
import { wishlistSchema } from '../schemas/wishlist'
import { WISHLIST_COLUMNS, type WishlistRow } from '../supabase-types'
import type { ToolHandler } from './with-auth'

export const createWishlistInput = wishlistSchema.strict()
export type CreateWishlistInput = z.infer<typeof createWishlistInput>
export type CreateWishlistOutput = WishlistRow

export const createWishlist: ToolHandler<CreateWishlistInput, CreateWishlistOutput> = async (
  input,
  { client }
) => {
  const row: Record<string, unknown> = { name: input.name }
  if (input.description !== undefined && input.description !== '')
    row.description = input.description
  if (input.event_date !== undefined && input.event_date !== '') row.event_date = input.event_date

  const { data, error } = await client
    .from('wishlists')
    .insert(row)
    .select(WISHLIST_COLUMNS)
    .single()
  if (error) throw mapSupabaseError(error)
  return data as WishlistRow
}
