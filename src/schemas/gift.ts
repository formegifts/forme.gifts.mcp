// Vendored from the forme.gifts web app — keep in sync when the source schema changes.

import { z } from 'zod'
import {
  GIFT_DESCRIPTION_MAX_LENGTH,
  GIFT_NAME_MAX_LENGTH,
  GIFT_PRICE_MAX,
  GIFT_PRODUCT_LINK_MAX_LENGTH,
} from './validation-constants'

export const giftSchema = z
  .object({
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
  })
  .refine(
    (data) => {
      if (data.price_min != null && data.price_max != null) {
        return data.price_min <= data.price_max
      }
      return true
    },
    {
      message: 'Minimum price cannot exceed maximum price',
      path: ['price_min'],
    }
  )

export type GiftFormData = z.infer<typeof giftSchema>
