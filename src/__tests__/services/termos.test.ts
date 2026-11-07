import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '../../services/api'
import { baixarPdfTermo, criarTermo } from '../../services/termos'
import { chamada, falhaDeRede, mockarAdapter, respondeErro, respondeOk } from '../helpers/api'

let adapter: ReturnType<typeof mockarAdapter>

beforeEach(() => {
  adapter = mockarAdapter(api)
})

describe('criarTermo', () => {
  it('envia o animal e a solicitação', async () => {
    adapter.mockImplementation(respondeOk({ id: 't1' }, 201))

    await expect(criarTermo('a1', 's1')).resolves.toEqual({ id: 't1' })

    expect(chamada(adapter)).toMatchObject({
      metodo: 'post',
      url: '/termos-adocao',
      corpo: { animalId: 'a1', solicitacaoId: 's1' },
    })
  })
})

describe('baixarPdfTermo', () => {
  it('pede o PDF como Blob, com o id codificado', async () => {
    const pdf = new Blob(['%PDF'], { type: 'application/pdf' })
    adapter.mockImplementation(respondeOk(pdf))

    await expect(baixarPdfTermo('a/b')).resolves.toBe(pdf)

    expect(chamada(adapter)).toMatchObject({ url: '/termos-adocao/a%2Fb/pdf', responseType: 'blob' })
  })

  it('corrige o tipo quando a resposta não vem como application/pdf', async () => {
    adapter.mockImplementation(respondeOk(new Blob(['%PDF'], { type: 'application/octet-stream' })))

    const arquivo = await baixarPdfTermo('t1')

    expect(arquivo.type).toBe('application/pdf')
  })

  it('converte o erro em Blob para objeto, para mensagemDeErro ler o campo error', async () => {
    const corpo = new Blob([JSON.stringify({ error: 'Termo não encontrado.' })], { type: 'application/json' })
    adapter.mockImplementation(respondeErro(404, corpo))

    await expect(baixarPdfTermo('t1')).rejects.toMatchObject({
      response: { status: 404, data: { error: 'Termo não encontrado.' } },
    })
  })

  it('zera o corpo quando o erro em Blob não é JSON', async () => {
    adapter.mockImplementation(respondeErro(500, new Blob(['<html>'], { type: 'text/html' })))

    await expect(baixarPdfTermo('t1')).rejects.toMatchObject({ response: { status: 500, data: null } })
  })

  it('repassa a falha de rede sem tentar ler o corpo', async () => {
    adapter.mockImplementation(falhaDeRede())

    await expect(baixarPdfTermo('t1')).rejects.toMatchObject({ code: 'ERR_NETWORK' })
  })
})
