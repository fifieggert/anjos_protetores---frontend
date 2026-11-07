import { describe, expect, it } from 'vitest'
import { api } from '../../services/api'
import { buscarPainel } from '../../services/dashboard'
import { chamada, falhaDeRede, mockarAdapter, respondeErro, respondeOk } from '../helpers/api'

describe('buscarPainel', () => {
  it('busca GET /dashboard e devolve os dados', async () => {
    const painel = { animais: { total: 3 } }
    const adapter = mockarAdapter(api)
    adapter.mockImplementation(respondeOk(painel))

    await expect(buscarPainel()).resolves.toEqual(painel)

    expect(chamada(adapter)).toMatchObject({ metodo: 'get', url: '/dashboard' })
  })

  it('repassa o erro da API para a tela tratar', async () => {
    mockarAdapter(api).mockImplementation(respondeErro(403, { error: 'Sem permissão.' }))

    await expect(buscarPainel()).rejects.toMatchObject({
      response: { status: 403, data: { error: 'Sem permissão.' } },
    })
  })

  it('repassa a falha de rede', async () => {
    mockarAdapter(api).mockImplementation(falhaDeRede())

    await expect(buscarPainel()).rejects.toMatchObject({ code: 'ERR_NETWORK' })
  })
})
