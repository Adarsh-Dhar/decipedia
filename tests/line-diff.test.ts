import { describe, expect, it } from 'vitest'
import { diffLines } from '../lib/line-diff'

describe('diffLines', () => {
  it('marks inserted and removed lines while preserving unchanged lines', () => {
    expect(diffLines('alpha\nold\nomega', 'alpha\nnew\nomega')).toEqual([
      { kind: 'same', value: 'alpha' },
      { kind: 'removed', value: 'old' },
      { kind: 'added', value: 'new' },
      { kind: 'same', value: 'omega' },
    ])
  })

  it('handles empty and identical content', () => {
    expect(diffLines('', '')).toEqual([{ kind: 'same', value: '' }])
    expect(diffLines('one\ntwo', 'one\ntwo')).toEqual([
      { kind: 'same', value: 'one' },
      { kind: 'same', value: 'two' },
    ])
  })
})
