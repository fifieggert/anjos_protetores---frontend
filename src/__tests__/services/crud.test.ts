import { beforeEach, describe, expect, it } from 'vitest'
import * as adocoes from '../../services/adocoes'
import * as animais from '../../services/animais'
import { api } from '../../services/api'
import * as eventos from '../../services/eventos'
import * as usuarios from '../../services/usuarios'
import { chamada, mockarAdapter, respondeErro, respondeOk } from '../helpers/api'

// Services que só traduzem a chamada em HTTP: o contrato é método + URL + corpo.
const dados = { nome: 'Rex' } as never
// id com caractere especial: precisa ir codificado na URL
const id = 'a/b'
const idNaUrl = 'a%2Fb'

const casos: [string, () => Promise<unknown>, string, string, unknown?][] = [
  ['listarAnimais', () => animais.listarAnimais(), 'get', '/animais'],
  ['criarAnimal', () => animais.criarAnimal(dados), 'post', '/animais', dados],
  ['atualizarAnimal', () => animais.atualizarAnimal(id, dados), 'put', `/animais/${idNaUrl}`, dados],
  ['excluirAnimal', () => animais.excluirAnimal(id), 'delete', `/animais/${idNaUrl}`],

  ['listarSolicitacoes', () => adocoes.listarSolicitacoes(), 'get', '/solicitacoes-adocao'],
  ['marcarEmContato', () => adocoes.marcarEmContato(id), 'patch', `/solicitacoes-adocao/${idNaUrl}`, { status: 'EM_CONTATO' }],
  ['concluirAdocao', () => adocoes.concluirAdocao(id), 'post', `/solicitacoes-adocao/${idNaUrl}/concluir`],
  ['cancelarAdocao', () => adocoes.cancelarAdocao(id), 'post', `/solicitacoes-adocao/${idNaUrl}/cancelar`],
  ['excluirSolicitacao', () => adocoes.excluirSolicitacao(id), 'delete', `/solicitacoes-adocao/${idNaUrl}`],

  ['criarEvento', () => eventos.criarEvento(dados), 'post', '/eventos', dados],
  ['atualizarEvento', () => eventos.atualizarEvento(id, dados), 'put', `/eventos/${idNaUrl}`, dados],
  ['excluirEvento', () => eventos.excluirEvento(id), 'delete', `/eventos/${idNaUrl}`],

  ['listarUsuarios', () => usuarios.listarUsuarios(), 'get', '/usuarios'],
  ['criarUsuario', () => usuarios.criarUsuario(dados), 'post', '/usuarios', dados],
  ['atualizarUsuario', () => usuarios.atualizarUsuario(id, dados), 'put', `/usuarios/${idNaUrl}`, dados],
  ['excluirUsuario', () => usuarios.excluirUsuario(id), 'delete', `/usuarios/${idNaUrl}`],
  ['trocarSenha', () => usuarios.trocarSenha(dados), 'patch', '/usuarios/me/senha', dados],
]

describe.each(casos)('%s', (_, chamar, metodo, url, corpo) => {
  let adapter: ReturnType<typeof mockarAdapter>

  beforeEach(() => {
    adapter = mockarAdapter(api)
  })

  it(`faz ${metodo.toUpperCase()} ${url}`, async () => {
    adapter.mockImplementation(respondeOk())

    await chamar()

    expect(chamada(adapter)).toMatchObject({ metodo, url })
    if (corpo !== undefined) expect(chamada(adapter).corpo).toEqual(corpo)
  })

  it('repassa o erro da API', async () => {
    adapter.mockImplementation(respondeErro(409, { error: 'Conflito.' }))

    await expect(chamar()).rejects.toMatchObject({ response: { status: 409 } })
  })
})

describe('retorno dos dados', () => {
  it('devolve o corpo da resposta', async () => {
    mockarAdapter(api).mockImplementation(respondeOk([{ id: '1' }]))

    await expect(animais.listarAnimais()).resolves.toEqual([{ id: '1' }])
  })
})

describe('listarEventos', () => {
  it('pede todos os eventos por padrão', async () => {
    const adapter = mockarAdapter(api)
    adapter.mockImplementation(respondeOk([]))

    await eventos.listarEventos()

    expect(chamada(adapter)).toMatchObject({ url: '/eventos', params: { periodo: 'todos' } })
  })

  it('filtra pelo período informado', async () => {
    const adapter = mockarAdapter(api)
    adapter.mockImplementation(respondeOk([]))

    await eventos.listarEventos('proximos' as never)

    expect(chamada(adapter).params).toEqual({ periodo: 'proximos' })
  })
})
