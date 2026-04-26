import { z } from 'zod'
import { mapSupabaseError } from '../errors'
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
}

type Row = {
  id: string
  name: string
  description: string | null
  event_date: string | null
  updated_at: string
  gifts: Array<{ count: number }> | null
}

export const listWishlists: ToolHandler<ListWishlistsInput, WishlistSummary[]> = async (
  _input,
  { client }
) => {
  const { data, error } = await client
    .from('wishlists')
    .select('id, name, description, event_date, updated_at, gifts(count)')
    .eq('disabled', false)
    .order('updated_at', { ascending: false })
  if (error) throw mapSupabaseError(error)
  return ((data ?? []) as Row[]).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    event_date: row.event_date,
    gift_count: row.gifts?.[0]?.count ?? 0,
    updated_at: row.updated_at,
  }))
}
