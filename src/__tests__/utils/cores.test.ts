import { describe, expect, it } from 'vitest'
import { comOpacidade } from '../../theme/cores'

describe('comOpacidade', () => {
  it('converte cada par do hex em base 16', () => {
    expect(comOpacidade('#336699', 0.5)).toBe('rgba(51, 102, 153, 0.5)')
  })

  it('aceita letras do hex, maiúsculas ou minúsculas', () => {
    expect(comOpacidade('#FFffAa', 1)).toBe('rgba(255, 255, 170, 1)')
  })

  it('mantém os zeros', () => {
    expect(comOpacidade('#000000', 0)).toBe('rgba(0, 0, 0, 0)')
  })
})
