export type WishlistRow = {
  id: string
  user_id: string
  name: string
  description: string | null
  event_date: string | null
  position: number
  disabled: boolean
  created_at: string
  updated_at: string
}

export type GiftRow = {
  id: string
  wishlist_id: string
  name: string
  description: string | null
  product_link: string | null
  price_min: number | null
  price_max: number | null
  position: number
  image_urls: string[] | null
  created_at: string
  updated_at: string
}
