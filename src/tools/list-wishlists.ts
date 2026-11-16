import { z } from 'zod'
import { mapSupabaseError } from '../errors'
import { isWishlistExpired } from '../wishlist-expiry'
import type { ToolHandler } from './with-auth'

export const listWishlistsInput = z.object({}).strict()
export type ListWishlistsInput = z.infer<typeof listWishlistsInput>

export type WishlistSummary = {
  id: string
  name: string
  description: string | null
  event_date: string | null
  gift_count: number
  updated_at: string
  /** Ended lists are read-only: no gift adds/edits, guests see an "ended" page. */
  is_expired: boolean
}

type Row = {
  id: string
  name: string
  description: string | null
  event_date: string | null
  updated_at: string
  gifts: Array<{ count: number }> | null
}

export type ListWishlistsOutput = { wishlists: WishlistSummary[] }

export const listWishlists: ToolHandler<ListWishlistsInput, ListWishlistsOutput> = async (
  _input,
  { client }
) => {
  const { data, error } = await client
    .from('wishlists')
    .select('id, name, description, event_date, updated_at, gifts(count)')
    .eq('disabled', false)
    // The stash is a wishlists row (kind = 'stash') but never a list.
    .eq('kind', 'regular')
    .order('updated_at', { ascending: false })
  if (error) throw mapSupabaseError(error)
  const wishlists = ((data ?? []) as Row[]).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    event_date: row.event_date,
    gift_count: row.gifts?.[0]?.count ?? 0,
    updated_at: row.updated_at,
    is_expired: isWishlistExpired(row.event_date),
  }))
  return { wishlists }
}
