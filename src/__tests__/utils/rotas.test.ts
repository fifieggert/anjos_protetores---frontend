import { describe, expect, it } from 'vitest'
import { rotaInicial } from '../../utils/rotas'

describe('rotaInicial', () => {
  it('leva a coordenação (ADMIN) para o Dashboard', () => {
    expect(rotaInicial('ADMIN')).toBe('/dashboard')
  })

  it('leva o voluntário para a lista de animais, porque o Dashboard é só da coordenação', () => {
    expect(rotaInicial('VOLUNTARIO')).toBe('/animais')
  })
})
