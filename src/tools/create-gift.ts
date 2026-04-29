import { z } from 'zod'
import { McpToolError, mapSupabaseError } from '../errors'
import {
  GIFT_DESCRIPTION_MAX_LENGTH,
  GIFT_NAME_MAX_LENGTH,
  GIFT_PRICE_MAX,
  GIFT_PRODUCT_LINK_MAX_LENGTH,
} from '../schemas/validation-constants'
import { GIFT_COLUMNS, type GiftRow } from '../supabase-types'
import { omitEmpty } from './omit-empty'
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

// Goes through the SECURITY DEFINER RPC so the per-tier gift cap and the
// trimmed-name / image-count validations defined alongside the schema are
// enforced — a direct INSERT would skip them.
export const createGift: ToolHandler<CreateGiftInput, CreateGiftOutput> = async (
  input,
  { client }
) => {
  const params = omitEmpty(input, {
    wishlist_id: 'p_wishlist_id',
    name: 'p_name',
    description: 'p_description',
    product_link: 'p_product_link',
    price_min: 'p_price_min',
    price_max: 'p_price_max',
    image_urls: 'p_image_urls',
  })

  const { data: id, error: rpcError } = await client.rpc('create_gift', params)
  if (rpcError) throw mapSupabaseError(rpcError)
  if (typeof id !== 'string')
    throw new McpToolError('failed_precondition', 'create_gift RPC returned no id', false)

  const { data: row, error: selectError } = await client
    .from('gifts')
    .select(GIFT_COLUMNS)
    .eq('id', id)
    .single()
  if (selectError) throw mapSupabaseError(selectError)
  return row as GiftRow
}
