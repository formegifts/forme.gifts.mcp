import { z } from 'zod'
import { McpToolError, mapSupabaseError } from '../errors'
import {
  GIFT_DESCRIPTION_MAX_LENGTH,
  GIFT_NAME_MAX_LENGTH,
  GIFT_PRICE_MAX,
  GIFT_PRODUCT_LINK_MAX_LENGTH,
} from '../schemas/validation-constants'
import { GIFT_COLUMNS, type GiftRow } from '../supabase-types'
import type { ToolHandler } from './with-auth'

export const updateGiftInput = z
  .object({
    id: z.string().uuid(),
    name: z.string().min(1).max(GIFT_NAME_MAX_LENGTH).optional(),
    description: z.string().max(GIFT_DESCRIPTION_MAX_LENGTH).optional().or(z.literal('')),
    product_link: z
      .string()
      .max(GIFT_PRODUCT_LINK_MAX_LENGTH)
      .url()
      .refine((val) => /^https?:\/\//i.test(val), 'Only http and https links are allowed')
      .optional()
      .or(z.literal('')),
    price_min: z.number().min(0).max(GIFT_PRICE_MAX).nullable().optional(),
    price_max: z.number().min(0).max(GIFT_PRICE_MAX).nullable().optional(),
    image_urls: z.array(z.string().url()).max(5).optional(),
  })
  .strict()
export type UpdateGiftInput = z.infer<typeof updateGiftInput>
export type UpdateGiftOutput = GiftRow

export const updateGift: ToolHandler<UpdateGiftInput, UpdateGiftOutput> = async (
  input,
  { client }
) => {
  const patch: Record<string, unknown> = {}
  if (input.name !== undefined) patch.name = input.name
  if (input.description !== undefined && input.description !== '')
    patch.description = input.description
  if (input.product_link !== undefined && input.product_link !== '')
    patch.product_link = input.product_link
  if (input.price_min !== undefined && input.price_min !== null) patch.price_min = input.price_min
  if (input.price_max !== undefined && input.price_max !== null) patch.price_max = input.price_max
  if (input.image_urls !== undefined) patch.image_urls = input.image_urls

  if (Object.keys(patch).length === 0) {
    throw new McpToolError('invalid_argument', 'Provide at least one field to update.', false)
  }

  const { data, error } = await client
    .from('gifts')
    .update(patch)
    .eq('id', input.id)
    .select(GIFT_COLUMNS)
    .single()
  if (error) throw mapSupabaseError(error)
  return data as GiftRow
}
