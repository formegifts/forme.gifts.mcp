import { describe, expect, it } from 'vitest'
import { omitEmpty } from '../../src/tools/omit-empty'

describe('omitEmpty', () => {
  it('keeps non-empty values as-is', () => {
    expect(omitEmpty({ a: 'x', b: 1, c: true, d: ['hi'] })).toEqual({
      a: 'x',
      b: 1,
      c: true,
      d: ['hi'],
    })
  })

  it('drops undefined values', () => {
    expect(omitEmpty({ a: 'x', b: undefined })).toEqual({ a: 'x' })
  })

  it('drops null values', () => {
    expect(omitEmpty({ a: 'x', b: null })).toEqual({ a: 'x' })
  })

  it('drops empty-string values (treat unset same as missing)', () => {
    expect(omitEmpty({ a: 'x', b: '' })).toEqual({ a: 'x' })
  })

  it('keeps zero, false, and empty arrays (only undefined/null/empty-string drop)', () => {
    expect(omitEmpty({ a: 0, b: false, c: [] })).toEqual({ a: 0, b: false, c: [] })
  })

  it('renames keys when a mapping is provided', () => {
    expect(omitEmpty({ name: 'x', description: 'y' }, { name: 'p_name' })).toEqual({
      p_name: 'x',
      description: 'y',
    })
  })

  it('drops keys whose mapped name is for a value that is also empty', () => {
    expect(omitEmpty({ name: 'x', description: '' }, { name: 'p_name' })).toEqual({ p_name: 'x' })
  })
})
