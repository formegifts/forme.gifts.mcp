import { describe, expect, it } from 'vitest'
import { assertServerConfig, PLACEHOLDER_ANON_KEY } from '../src/config'

describe('assertServerConfig', () => {
  it('throws when anon key is the placeholder', () => {
    expect(() => assertServerConfig(PLACEHOLDER_ANON_KEY)).toThrow(/FORME_SUPABASE_ANON_KEY/)
  })

  it('passes when anon key is any other value', () => {
    expect(() => assertServerConfig('eyJ.real.key')).not.toThrow()
  })
})
