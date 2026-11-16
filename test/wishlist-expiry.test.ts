import { describe, expect, it } from 'vitest'
import { isWishlistExpired } from '../src/wishlist-expiry'

const NOW = new Date('2026-11-16T23:30:00Z')

describe('isWishlistExpired', () => {
  it.each([
    ['2026-11-16', false],
    ['2026-11-15', false],
    ['2026-11-14', true],
    [null, false],
  ])('%s → %s', (date, expected) => {
    expect(isWishlistExpired(date, NOW)).toBe(expected)
  })
})
