import { describe, expect, it } from 'vitest'
import { nomeArquivoTermo } from '../../pages/Adocoes/nomeArquivoTermo'

describe('nomeArquivoTermo', () => {
  it.each([
    ['Rex', 'termo-adocao-rex.pdf'],
    ['Mel 2', 'termo-adocao-mel-2.pdf'],
    ['João Pé de Feijão', 'termo-adocao-joao-pe-de-feijao.pdf'],
    ['Bob   &   Lola', 'termo-adocao-bob-lola.pdf'],
  ])('nome válido: %s', (nome, esperado) => {
    expect(nomeArquivoTermo(nome)).toBe(esperado)
  })

  it.each([
    ['hífens nas pontas', '--Rex--'],
    ['espaços nas pontas', '  Rex  '],
    ['símbolos nas pontas', '!!Rex??'],
    ['pontas mistas', ' -!Rex!- '],
  ])('tira as sobras das pontas: %s', (_, nome) => {
    expect(nomeArquivoTermo(nome)).toBe('termo-adocao-rex.pdf')
  })

  it.each(['', '   ', '---', '!@#$%', '🐶'])('sem letras ou números, usa "animal": %j', (nome) => {
    expect(nomeArquivoTermo(nome)).toBe('termo-adocao-animal.pdf')
  })

  it('não deixa caminhos no nome do arquivo', () => {
    expect(nomeArquivoTermo('../../etc/passwd')).toBe('termo-adocao-etc-passwd.pdf')
  })

  describe('entrada longa maliciosa', () => {
    const TAMANHO = 200_000
    // Generoso de propósito: tempo quadrático em 200 mil caracteres levaria muito mais que isso.
    const LIMITE_MS = 1000

    it.each([
      ['hífens no meio', `a${'-'.repeat(TAMANHO)}b`, 'termo-adocao-a-b.pdf'],
      ['hífens sem fim de texto válido', `${'-'.repeat(TAMANHO)}a`, 'termo-adocao-a.pdf'],
      ['hífens intercalados', 'a-'.repeat(TAMANHO / 2), `termo-adocao-${'a-'.repeat(TAMANHO / 2 - 1)}a.pdf`],
      ['só hífens', '-'.repeat(TAMANHO), 'termo-adocao-animal.pdf'],
    ])('%s', (_, nome, esperado) => {
      const inicio = performance.now()
      const resultado = nomeArquivoTermo(nome)
      const duracao = performance.now() - inicio

      expect(resultado).toBe(esperado)
      expect(duracao).toBeLessThan(LIMITE_MS)
    })
  })
})
