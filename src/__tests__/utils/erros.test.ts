import { describe, expect, it } from 'vitest'
import { dadosDoErro, errosDosCampos, mensagemDeErro, statusDoErro } from '../../utils/erros'
import { erroAxios } from '../helpers/api'

describe('mensagemDeErro', () => {
  it('usa a mensagem enviada pela API', () => {
    expect(mensagemDeErro(erroAxios(409, { error: 'Já cadastrado.' }), 'genérica')).toBe('Já cadastrado.')
  })

  it('avisa quando o servidor não respondeu', () => {
    expect(mensagemDeErro(erroAxios(), 'genérica')).toBe('Não foi possível conectar ao servidor. Tente novamente.')
  })

  it.each([
    ['sem corpo', erroAxios(500)],
    ['error vazio', erroAxios(500, { error: '   ' })],
    ['error que não é texto', erroAxios(500, { error: 42 })],
    ['corpo em texto', erroAxios(500, '<html>')],
    ['erro que não veio do axios', new Error('falhou')],
  ])('usa a genérica: %s', (_, erro) => {
    expect(mensagemDeErro(erro, 'genérica')).toBe('genérica')
  })
})

describe('dadosDoErro', () => {
  it('devolve o corpo do erro do axios', () => {
    expect(dadosDoErro(erroAxios(400, { error: 'x' }))).toEqual({ error: 'x' })
  })

  it('devolve null para outros erros', () => {
    expect(dadosDoErro(new Error('x'))).toBeNull()
  })
})

describe('statusDoErro', () => {
  it('devolve o status HTTP', () => {
    expect(statusDoErro(erroAxios(404))).toBe(404)
  })

  it('não tem status sem resposta ou fora do axios', () => {
    expect(statusDoErro(erroAxios())).toBeUndefined()
    expect(statusDoErro(new Error('x'))).toBeUndefined()
  })
})

describe('errosDosCampos', () => {
  const campos = ['nome', 'telefone'] as const

  it('monta os erros no formato do form.setFields', () => {
    const erro = erroAxios(400, { campos: { nome: 'Nome curto.' } })
    expect(errosDosCampos(erro, campos)).toEqual([{ name: 'nome', errors: ['Nome curto.'] }])
  })

  it('ignora campos que não estão no formulário e mensagens que não são texto', () => {
    const erro = erroAxios(400, { campos: { outro: 'x', telefone: 123 } })
    expect(errosDosCampos(erro, campos)).toEqual([])
  })

  it('só vale para 400', () => {
    expect(errosDosCampos(erroAxios(409, { campos: { nome: 'x' } }), campos)).toEqual([])
  })

  it('devolve vazio sem "campos"', () => {
    expect(errosDosCampos(erroAxios(400, { error: 'x' }), campos)).toEqual([])
    expect(errosDosCampos(erroAxios(400, { campos: 'x' }), campos)).toEqual([])
  })
})
