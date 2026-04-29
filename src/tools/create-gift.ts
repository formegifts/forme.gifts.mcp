import { z } from 'zod'
import { mapSupabaseError } from '../errors'
import {
  GIFT_DESCRIPTION_MAX_LENGTH,
  GIFT_NAME_MAX_LENGTH,
  GIFT_PRICE_MAX,
  GIFT_PRODUCT_LINK_MAX_LENGTH,
} from '../schemas/validation-constants'
import { GIFT_COLUMNS, type GiftRow } from '../supabase-types'
import type { ToolHandler } from './with-auth'

// Fields inlined from src/schemas/gift.ts because giftSchema is wrapped in
// .refine() (price_min ≤ price_max), so its .shape isn't directly accessible.
// The price-ordering check is enforced by a Postgres CHECK constraint instead.
export const createGiftInput = z
  .object({
    wishlist_id: z.string().uuid(),
    name: z
      .string()
      .min(1, 'Name is required')
      .max(GIFT_NAME_MAX_LENGTH, `Name must be ${GIFT_NAME_MAX_LENGTH} characters or less`),
    description: z
      .string()
      .max(
        GIFT_DESCRIPTION_MAX_LENGTH,
        `Description must be ${GIFT_DESCRIPTION_MAX_LENGTH} characters or less`
      )
      .optional()
      .or(z.literal('')),
    product_link: z
      .string()
      .max(
        GIFT_PRODUCT_LINK_MAX_LENGTH,
        `URL must be ${GIFT_PRODUCT_LINK_MAX_LENGTH} characters or less`
      )
      .url('Please enter a valid URL')
      .refine((val) => /^https?:\/\//i.test(val), 'Only http and https links are allowed')
      .optional()
      .or(z.literal('')),
    price_min: z
      .number()
      .min(0, 'Price must be positive')
      .max(GIFT_PRICE_MAX, `Price cannot exceed ${GIFT_PRICE_MAX}`)
      .nullable()
      .optional(),
    price_max: z
      .number()
      .min(0, 'Price must be positive')
      .max(GIFT_PRICE_MAX, `Price cannot exceed ${GIFT_PRICE_MAX}`)
      .nullable()
      .optional(),
    image_urls: z.array(z.string().url()).max(5).optional(),
  })
  .strict()
export type CreateGiftInput = z.infer<typeof createGiftInput>
export type CreateGiftOutput = GiftRow

export const createGift: ToolHandler<CreateGiftInput, CreateGiftOutput> = async (
  input,
  { client }
) => {
  const row: Record<string, unknown> = { wishlist_id: input.wishlist_id, name: input.name }
  if (input.description !== undefined && input.description !== '')
    row.description = input.description
  if (input.product_link !== undefined && input.product_link !== '')
    row.product_link = input.product_link
  if (input.price_min !== undefined && input.price_min !== null) row.price_min = input.price_min
  if (input.price_max !== undefined && input.price_max !== null) row.price_max = input.price_max
  if (input.image_urls !== undefined) row.image_urls = input.image_urls

  const { data, error } = await client.from('gifts').insert(row).select(GIFT_COLUMNS).single()
  if (error) throw mapSupabaseError(error)
  return data as GiftRow
}
