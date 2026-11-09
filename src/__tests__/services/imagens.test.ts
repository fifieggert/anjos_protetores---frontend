import axios from 'axios'
import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '../../services/api'
import { enviarImagem } from '../../services/imagens'
import { salvarSessao } from '../../utils/armazenamento'
import { chamada, falhaDeRede, mockarAdapter, respondeErro, respondeOk } from '../helpers/api'
import { tokenDoPerfil } from '../helpers/jwt'

const URL_IMAGEM = '/api/imagens/0f8b2c3d-1e2f-4a5b-8c6d-7e8f9a0b1c2d.webp'
const foto = () => new File(['conteudo'], 'rex.webp', { type: 'image/webp' })

describe('enviarImagem', () => {
  let adapter: ReturnType<typeof mockarAdapter>

  beforeEach(() => {
    adapter = mockarAdapter(api)
  })

  it('faz POST /imagens com FormData no campo "arquivo", com o token, e devolve a url', async () => {
    const token = tokenDoPerfil('VOLUNTARIO')
    salvarSessao(token, 'Bia')
    adapter.mockImplementation(respondeOk({ url: URL_IMAGEM }, 201))
    const arquivo = foto()

    await expect(enviarImagem(arquivo)).resolves.toBe(URL_IMAGEM)

    const { metodo, url, corpo, autorizacao } = chamada(adapter)
    expect({ metodo, url, autorizacao }).toEqual({ metodo: 'post', url: '/imagens', autorizacao: `Bearer ${token}` })
    expect(corpo).toBeInstanceOf(FormData)
    expect((corpo as FormData).get('arquivo')).toBe(arquivo)
    expect([...(corpo as FormData).keys()]).toEqual(['arquivo'])
  })

  it('não fixa o Content-Type: o navegador monta o multipart com o boundary', async () => {
    adapter.mockImplementation(respondeOk({ url: URL_IMAGEM }, 201))

    await enviarImagem(foto())

    const contentType = adapter.mock.calls[0]?.[0].headers.getContentType()
    expect(String(contentType ?? '')).not.toMatch(/multipart|json/)
  })

  it.each([413, 415, 429, 503])('repassa o erro %i da API', async (status) => {
    adapter.mockImplementation(respondeErro(status, { error: 'Erro do servidor.' }))

    await expect(enviarImagem(foto())).rejects.toMatchObject({ response: { status } })
  })

  it('repassa a falha de rede', async () => {
    adapter.mockImplementation(falhaDeRede())

    await expect(enviarImagem(foto())).rejects.toMatchObject({ code: 'ERR_NETWORK' })
  })

  it('repassa o AbortSignal ao axios (sem sinal, nenhum é enviado)', async () => {
    adapter.mockImplementation(respondeOk({ url: URL_IMAGEM }, 201))
    const controle = new AbortController()

    await enviarImagem(foto(), controle.signal)
    await enviarImagem(foto())

    expect(adapter.mock.calls[0]?.[0].signal).toBe(controle.signal)
    expect(adapter.mock.calls[1]?.[0].signal).toBeUndefined()
  })

  it('sinal abortado: o axios rejeita com cancelamento (ERR_CANCELED) e nada é enviado', async () => {
    adapter.mockImplementation(respondeOk({ url: URL_IMAGEM }, 201))
    const controle = new AbortController()
    controle.abort()

    const erro = await enviarImagem(foto(), controle.signal).catch((e: unknown) => e)

    expect(axios.isCancel(erro)).toBe(true)
    expect(erro).toMatchObject({ code: 'ERR_CANCELED' })
    expect(adapter).not.toHaveBeenCalled()
  })

  it.each([null, {}, { url: '' }, { url: 42 }])('resposta sem url (%j) vira erro', async (resposta) => {
    adapter.mockImplementation(respondeOk(resposta, 201))

    await expect(enviarImagem(foto())).rejects.toThrow('Resposta inesperada do servidor ao enviar a imagem.')
  })
})
