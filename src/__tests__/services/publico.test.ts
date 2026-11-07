import { beforeEach, describe, expect, it } from 'vitest'
import { apiPublica } from '../../services/api'
import { buscarEstatisticas, listarAnimaisPublicos, listarEventosPublicos, registrarInteresse } from '../../services/publico'
import { salvarSessao } from '../../utils/armazenamento'
import { chamada, falhaDeRede, mockarAdapter, respondeErro, respondeOk } from '../helpers/api'

let adapter: ReturnType<typeof mockarAdapter>

beforeEach(() => {
  adapter = mockarAdapter(apiPublica)
})

describe('listarAnimaisPublicos', () => {
  it('sem filtro, pede todos', async () => {
    adapter.mockImplementation(respondeOk([{ id: '1' }]))

    await expect(listarAnimaisPublicos()).resolves.toEqual([{ id: '1' }])

    expect(chamada(adapter)).toMatchObject({ metodo: 'get', url: '/publico/animais', params: {} })
  })

  it('envia os filtros como parâmetros', async () => {
    adapter.mockImplementation(respondeOk([]))

    await listarAnimaisPublicos({ especie: 'GATO', porte: 'PEQUENO' })

    expect(chamada(adapter).params).toEqual({ especie: 'GATO', porte: 'PEQUENO' })
  })

  it('repassa a falha de rede', async () => {
    adapter.mockImplementation(falhaDeRede())

    await expect(listarAnimaisPublicos()).rejects.toMatchObject({ code: 'ERR_NETWORK' })
  })
})

describe('listarEventosPublicos e buscarEstatisticas', () => {
  it('busca os eventos', async () => {
    adapter.mockImplementation(respondeOk([{ id: 'e1' }]))

    await expect(listarEventosPublicos()).resolves.toEqual([{ id: 'e1' }])

    expect(chamada(adapter).url).toBe('/publico/eventos')
  })

  it('busca as estatísticas', async () => {
    adapter.mockImplementation(respondeOk({ animaisAdotados: 5 }))

    await expect(buscarEstatisticas()).resolves.toEqual({ animaisAdotados: 5 })

    expect(chamada(adapter).url).toBe('/publico/estatisticas')
  })
})

describe('registrarInteresse', () => {
  const dados = { animalId: 'a1', nome: 'Ana', telefone: '47999998888', aceitaContato: true } as const

  it('envia os dados por POST e sem o token de quem estiver logado', async () => {
    salvarSessao('token-da-equipe', 'Coordenação')
    adapter.mockImplementation(respondeOk({ mensagem: 'ok' }, 201))

    await expect(registrarInteresse(dados)).resolves.toEqual({ mensagem: 'ok' })

    const enviada = chamada(adapter)
    expect(enviada).toMatchObject({ metodo: 'post', url: '/publico/interesses', corpo: dados })
    expect(enviada.autorizacao).toBeFalsy()
  })

  it('repassa o 409 de animal já reservado', async () => {
    adapter.mockImplementation(respondeErro(409, { error: 'Animal reservado.' }))

    await expect(registrarInteresse(dados)).rejects.toMatchObject({ response: { status: 409 } })
  })
})
