import { describe, expect, it, vi } from 'vitest'
import { registerAllTools } from '../src/tools'

describe('registerAllTools', () => {
  it('registers list_wishlists and get_wishlist with input schemas', () => {
    const registerTool = vi.fn()
    const server = { registerTool } as unknown as Parameters<typeof registerAllTools>[0]
    registerAllTools(server)
    const names = registerTool.mock.calls.map((c) => c[0])
    expect(names).toContain('list_wishlists')
    expect(names).toContain('get_wishlist')
    for (const call of registerTool.mock.calls) {
      const [, config, cb] = call
      expect(typeof cb).toBe('function')
      expect(config).toHaveProperty('description')
      expect(config).toHaveProperty('inputSchema')
    }
  })
})
