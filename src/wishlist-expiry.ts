/**
 * Mirror of forme.gifts' `public.wishlist_is_expired()`: a list has ended once
 * its event_date is more than one day in the past (UTC). Undated lists never end.
 */
export const isWishlistExpired = (eventDate: string | null, now: Date = new Date()): boolean => {
  if (!eventDate) return false
  const graceDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1))
  return eventDate < graceDay.toISOString().slice(0, 10)
}
