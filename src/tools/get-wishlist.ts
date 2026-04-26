import { z } from 'zod'
import { McpToolError, mapSupabaseError } from '../errors'
import type { GiftRow, WishlistRow } from '../supabase-types'
import type { ToolHandler } from './with-auth'

export const getWishlistInput = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).optional(),
  })
  .strict()
export type GetWishlistInput = z.infer<typeof getWishlistInput>

export type GetWishlistOutput = WishlistRow & { gifts: GiftRow[] }

export const getWishlist: ToolHandler<GetWishlistInput, GetWishlistOutput> = async (
  input,
  { client }
) => {
  const hasId = typeof input.id === 'string' && input.id.length > 0
  const hasName = typeof input.name === 'string' && input.name.length > 0
  if (hasId === hasName) {
    throw new McpToolError('invalid_argument', 'Provide exactly one of `id` or `name`.', false)
  }

  const column = hasId ? 'id' : 'name'
  const value = (hasId ? input.id : input.name) as string

  const { data: wishlist, error } = await client
    .from('wishlists')
    .select(
      'id, user_id, name, description, event_date, position, disabled, created_at, updated_at'
    )
    .eq(column, value)
    .maybeSingle()
  if (error) throw mapSupabaseError(error)
  if (!wishlist) {
    throw new McpToolError('invalid_argument', `No wishlist found for ${column}=${value}.`, false)
  }

  const wishlistRow = wishlist as WishlistRow
  const { data: gifts, error: giftsError } = await client
    .from('gifts')
    .select(
      'id, wishlist_id, name, description, product_link, price_min, price_max, position, image_urls, created_at, updated_at'
    )
    .eq('wishlist_id', wishlistRow.id)
    .order('position', { ascending: true })
  if (giftsError) throw mapSupabaseError(giftsError)

  return { ...wishlistRow, gifts: (gifts ?? []) as GiftRow[] }
}
