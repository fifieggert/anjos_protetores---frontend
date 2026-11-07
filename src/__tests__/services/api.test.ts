import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api, apiPublica, registrarAoNaoAutorizado } from '../../services/api'
import { salvarSessao } from '../../utils/armazenamento'
import { chamada, falhaDeRede, mockarAdapter, respondeErro, respondeOk } from '../helpers/api'

describe('token nas requisições', () => {
  it('api envia o token de quem está logado', async () => {
    salvarSessao('meu-token', 'Ana')
    const adapter = mockarAdapter(api)
    adapter.mockImplementation(respondeOk())

    await api.get('/animais')

    expect(chamada(adapter).autorizacao).toBe('Bearer meu-token')
  })

  it('api não envia o cabeçalho sem sessão', async () => {
    const adapter = mockarAdapter(api)
    adapter.mockImplementation(respondeOk())

    await api.get('/animais')

    expect(chamada(adapter).autorizacao).toBeFalsy()
  })

  it('apiPublica nunca envia o token, mesmo com alguém logado', async () => {
    salvarSessao('meu-token', 'Ana')
    const adapter = mockarAdapter(apiPublica)
    adapter.mockImplementation(respondeOk())

    await apiPublica.get('/publico/animais')

    expect(chamada(adapter).autorizacao).toBeFalsy()
  })
})

describe('resposta 401', () => {
  const aoNaoAutorizado = vi.fn()
  let cancelar: () => void

  beforeEach(() => {
    aoNaoAutorizado.mockClear()
    cancelar = registrarAoNaoAutorizado(aoNaoAutorizado)
    return () => cancelar()
  })

  it('encerra a sessão quando uma requisição autenticada recebe 401', async () => {
    mockarAdapter(api).mockImplementation(respondeErro(401))

    await expect(api.get('/animais')).rejects.toMatchObject({ response: { status: 401 } })

    expect(aoNaoAutorizado).toHaveBeenCalledOnce()
  })

  it('senha errada no login (401) não é sessão expirada', async () => {
    mockarAdapter(api).mockImplementation(respondeErro(401))

    await expect(api.post('/auth/login', {})).rejects.toBeDefined()

    expect(aoNaoAutorizado).not.toHaveBeenCalled()
  })

  it.each([
    ['403', respondeErro(403)],
    ['500', respondeErro(500)],
    ['falha de rede', falhaDeRede()],
  ])('%s não encerra a sessão', async (_, resposta) => {
    mockarAdapter(api).mockImplementation(resposta)

    await expect(api.get('/animais')).rejects.toBeDefined()

    expect(aoNaoAutorizado).not.toHaveBeenCalled()
  })

  it('401 na rota pública não encerra a sessão', async () => {
    mockarAdapter(apiPublica).mockImplementation(respondeErro(401))

    await expect(apiPublica.get('/publico/animais')).rejects.toBeDefined()

    expect(aoNaoAutorizado).not.toHaveBeenCalled()
  })

  it('depois de cancelar o registro, o callback não é chamado', async () => {
    cancelar()
    mockarAdapter(api).mockImplementation(respondeErro(401))

    await expect(api.get('/animais')).rejects.toBeDefined()

    expect(aoNaoAutorizado).not.toHaveBeenCalled()
  })

  it('cancelar um registro antigo não remove o registro mais novo', async () => {
    const novo = vi.fn()
    const cancelarNovo = registrarAoNaoAutorizado(novo)
    cancelar()
    mockarAdapter(api).mockImplementation(respondeErro(401))

    await expect(api.get('/animais')).rejects.toBeDefined()

    expect(novo).toHaveBeenCalledOnce()
    cancelarNovo()
  })
})
