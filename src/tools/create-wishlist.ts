import type { z } from 'zod'
import { McpToolError, mapSupabaseError } from '../errors'
import { wishlistSchema } from '../schemas/wishlist'
import { WISHLIST_COLUMNS, type WishlistRow } from '../supabase-types'
import { omitEmpty } from './omit-empty'
import type { ToolHandler } from './with-auth'

export const createWishlistInput = wishlistSchema.strict()
export type CreateWishlistInput = z.infer<typeof createWishlistInput>
export type CreateWishlistOutput = WishlistRow

// Direct INSERT would (1) fail RLS (wishlists.user_id is NOT NULL with no default)
// and (2) bypass the per-tier wishlist cap the RPC enforces.
export const createWishlist: ToolHandler<CreateWishlistInput, CreateWishlistOutput> = async (
  input,
  { client }
) => {
  const params = omitEmpty(input, {
    name: 'p_name',
    description: 'p_description',
    event_date: 'p_event_date',
  })

  const { data: id, error: rpcError } = await client.rpc('create_wishlist', params)
  if (rpcError) throw mapSupabaseError(rpcError)
  if (typeof id !== 'string')
    throw new McpToolError('failed_precondition', 'create_wishlist RPC returned no id', false)

  const { data: row, error: selectError } = await client
    .from('wishlists')
    .select(WISHLIST_COLUMNS)
    .eq('id', id)
    .single()
  if (selectError) throw mapSupabaseError(selectError)
  return row as WishlistRow
}
