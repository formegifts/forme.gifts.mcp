import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { getWishlist, getWishlistInput } from './get-wishlist'
import { listWishlists, listWishlistsInput } from './list-wishlists'
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
}
