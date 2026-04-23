// Vendored from ../forme.gifts/src/lib/schemas/wishlist.ts
// When changing schemas in the web app repo, update this file.

import { z } from 'zod'
import { WISHLIST_DESCRIPTION_MAX_LENGTH, WISHLIST_NAME_MAX_LENGTH } from './validation-constants'

export const wishlistSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(WISHLIST_NAME_MAX_LENGTH, `Name must be ${WISHLIST_NAME_MAX_LENGTH} characters or less`),
  description: z
    .string()
    .max(
      WISHLIST_DESCRIPTION_MAX_LENGTH,
      `Description must be ${WISHLIST_DESCRIPTION_MAX_LENGTH} characters or less`
    )
    .optional()
    .or(z.literal('')),
  event_date: z.string().optional().or(z.literal('')),
})

export type WishlistFormData = z.infer<typeof wishlistSchema>
