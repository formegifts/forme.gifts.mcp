import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { createGift, createGiftInput } from './create-gift'
import { createWishlist, createWishlistInput } from './create-wishlist'
import { deleteWishlist, deleteWishlistInput } from './delete-wishlist'
import { getWishlist, getWishlistInput } from './get-wishlist'
import { listWishlists, listWishlistsInput } from './list-wishlists'
import { updateWishlist, updateWishlistInput } from './update-wishlist'
import { withAuth } from './with-auth'

export const registerAllTools = (server: McpServer): void => {
  server.registerTool(
    'list_wishlists',
    {
      description: "List the signed-in user's wishlists with gift counts.",
      inputSchema: listWishlistsInput.shape,
    },
    withAuth(listWishlists) as never
  )

  server.registerTool(
    'get_wishlist',
    {
      description: 'Fetch a single wishlist by id or name, including its gifts.',
      inputSchema: getWishlistInput.shape,
    },
    withAuth(getWishlist) as never
  )

  server.registerTool(
    'create_wishlist',
    {
      description:
        'Create a new wishlist for the signed-in user. Returns the created wishlist row.',
      inputSchema: createWishlistInput.shape,
    },
    withAuth(createWishlist) as never
  )

  server.registerTool(
    'update_wishlist',
    {
      description:
        "Update a wishlist's name, description, or event_date by id. At least one field besides id is required.",
      inputSchema: updateWishlistInput.shape,
    },
    withAuth(updateWishlist) as never
  )

  server.registerTool(
    'delete_wishlist',
    {
      description:
        'Delete a wishlist by id. Without `confirm: true`, returns a dry-run summary of what would be deleted. Pass `confirm: true` to actually delete.',
      inputSchema: deleteWishlistInput.shape,
    },
    withAuth(deleteWishlist) as never
  )

  server.registerTool(
    'create_gift',
    {
      description:
        'Create a gift inside a wishlist. Requires wishlist_id and name. Optional: description, product_link, price_min, price_max, image_urls (max 5).',
      inputSchema: createGiftInput.shape,
    },
    withAuth(createGift) as never
  )
}
