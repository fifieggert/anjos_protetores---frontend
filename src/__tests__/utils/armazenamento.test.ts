import { afterEach, describe, expect, it, vi } from 'vitest'
import { lerNome, lerToken, limparSessao, salvarSessao } from '../../utils/armazenamento'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('sessão no localStorage', () => {
  it('salva e lê token e nome', () => {
    salvarSessao('tok', 'Ana')
    expect(lerToken()).toBe('tok')
    expect(lerNome()).toBe('Ana')
  })

  it('sem nome, apaga o nome anterior', () => {
    salvarSessao('tok', 'Ana')
    salvarSessao('tok2', null)
    expect(lerNome()).toBeNull()
  })

  it('limparSessao apaga os dois', () => {
    salvarSessao('tok', 'Ana')
    limparSessao()
    expect(lerToken()).toBeNull()
    expect(lerNome()).toBeNull()
  })
})

describe('com o localStorage bloqueado', () => {
  it('ler devolve null em vez de lançar', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    expect(lerToken()).toBeNull()
  })

  it('gravar e limpar não lançam', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    expect(() => salvarSessao('tok', 'Ana')).not.toThrow()
    expect(() => limparSessao()).not.toThrow()
  })
})
