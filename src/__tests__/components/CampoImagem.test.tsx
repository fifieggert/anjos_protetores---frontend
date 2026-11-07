import { useState } from 'react'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CampoImagem from '../../components/CampoImagem/CampoImagem'
import { mensagemErroUpload, validarArquivoImagem } from '../../components/CampoImagem/regras'
import { enviarImagem } from '../../services/imagens'
import { erroAxios } from '../helpers/api'
import { renderComAntd } from '../helpers/render'

vi.mock('../../services/imagens')

const enviar = vi.mocked(enviarImagem)
const URL_NOVA = '/api/imagens/0f8b2c3d-1e2f-4a5b-8c6d-7e8f9a0b1c2d.png'
const URL_ANTIGA = '/api/imagens/11111111-2222-4333-8444-555555555555.jpg'

// applyAccept: false para conseguir "escolher" arquivos que o seletor do navegador esconderia
const usuario = () => userEvent.setup({ applyAccept: false })

function arquivo(nome: string, tipo: string, tamanho = 1024) {
  const f = new File(['x'], nome, { type: tipo })
  Object.defineProperty(f, 'size', { value: tamanho })
  return f
}

const png = () => arquivo('rex.png', 'image/png')

// Campo controlado, como o Form.Item faz.
function Campo({
  inicial = null,
  aoMudar = () => undefined,
  aoEnviar,
}: {
  inicial?: string | null
  aoMudar?: (valor: string | null) => void
  aoEnviar?: (enviando: boolean) => void
}) {
  const [valor, setValor] = useState<string | null>(inicial)
  return (
    <CampoImagem
      id="fotoUrl"
      value={valor}
      onChange={(novo) => {
        setValor(novo)
        aoMudar(novo)
      }}
      textoAlternativo="Foto de Rex"
      onEnviandoChange={aoEnviar}
    />
  )
}

const entrada = () => screen.getByTestId('entrada-imagem') as HTMLInputElement
const alerta = () => screen.queryByRole('alert')

beforeEach(() => {
  enviar.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CampoImagem', () => {
  it('sem foto: botão "Enviar foto", dica de formatos e nenhuma pré-visualização', () => {
    renderComAntd(<Campo />)

    const botao = screen.getByRole('button', { name: 'Enviar foto' })
    expect(botao).toHaveAttribute('id', 'fotoUrl')
    expect(botao).toHaveAccessibleDescription('JPG, PNG ou WebP, com até 5 MB.')
    expect(screen.queryByRole('img', { name: 'Foto de Rex' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remover foto' })).not.toBeInTheDocument()
  })

  it('envio válido chama o service, atualiza o valor e mostra a prévia com a url do servidor', async () => {
    enviar.mockResolvedValue(URL_NOVA)
    const aoMudar = vi.fn()
    const aoEnviar = vi.fn()
    renderComAntd(<Campo aoMudar={aoMudar} aoEnviar={aoEnviar} />)
    const foto = png()

    await usuario().upload(entrada(), foto)

    expect(enviar).toHaveBeenCalledExactlyOnceWith(foto)
    expect(aoMudar).toHaveBeenCalledExactlyOnceWith(URL_NOVA)
    expect(await screen.findByRole('img', { name: 'Foto de Rex' })).toHaveAttribute('src', URL_NOVA)
    expect(screen.getByRole('button', { name: 'Trocar foto' })).toBeInTheDocument()
    expect(screen.getByText('Foto enviada.')).toBeInTheDocument()
    expect(aoEnviar.mock.calls).toEqual([[true], [false]])
    expect(alerta()).not.toBeInTheDocument()
  })

  it.each([
    ['JPEG', 'rex.jpg', 'image/jpeg'],
    ['WebP', 'rex.webp', 'image/webp'],
    ['sem tipo informado, mas com extensão aceita', 'rex.JPEG', ''],
  ])('aceita %s', async (_caso, nome, tipo) => {
    enviar.mockResolvedValue(URL_NOVA)
    renderComAntd(<Campo />)

    await usuario().upload(entrada(), arquivo(nome, tipo))

    expect(enviar).toHaveBeenCalledOnce()
  })

  it.each([
    ['SVG', arquivo('desenho.svg', 'image/svg+xml')],
    ['GIF', arquivo('anim.gif', 'image/gif')],
    ['PDF renomeado', arquivo('foto.png', 'application/pdf')],
    ['sem tipo e extensão estranha', arquivo('foto.txt', '')],
  ])('tipo inválido (%s) não chama a API', async (_caso, invalido) => {
    renderComAntd(<Campo />)

    await usuario().upload(entrada(), invalido)

    expect(enviar).not.toHaveBeenCalled()
    expect(alerta()).toHaveTextContent('Formato não aceito. Escolha uma foto JPG, PNG ou WebP.')
  })

  it('arquivo acima de 5 MB não chama a API; exatamente 5 MB pode', async () => {
    enviar.mockResolvedValue(URL_NOVA)
    renderComAntd(<Campo />)

    await usuario().upload(entrada(), arquivo('grande.jpg', 'image/jpeg', 5 * 1024 * 1024 + 1))
    expect(enviar).not.toHaveBeenCalled()
    expect(alerta()).toHaveTextContent('A foto deve ter no máximo 5 MB.')
    expect(screen.getByRole('button', { name: 'Enviar foto' })).toHaveAccessibleDescription(
      'JPG, PNG ou WebP, com até 5 MB. A foto deve ter no máximo 5 MB.',
    )

    await usuario().upload(entrada(), arquivo('limite.jpg', 'image/jpeg', 5 * 1024 * 1024))
    expect(enviar).toHaveBeenCalledOnce()
    await waitFor(() => expect(alerta()).not.toBeInTheDocument())
  })

  it('arquivo vazio não chama a API', async () => {
    renderComAntd(<Campo />)

    await usuario().upload(entrada(), arquivo('vazio.png', 'image/png', 0))

    expect(enviar).not.toHaveBeenCalled()
    expect(alerta()).toHaveTextContent('O arquivo está vazio. Escolha outra foto.')
  })

  it.each([
    ['401', erroAxios(401, { error: 'Token inválido ou expirado.' }), 'Sua sessão expirou. Entre novamente para enviar a foto.'],
    ['403', erroAxios(403), 'Sua conta não tem permissão para enviar fotos. Entre novamente ou fale com a coordenação.'],
    ['413 do proxy (sem corpo)', erroAxios(413), 'A foto é grande demais. Escolha um arquivo de até 5 MB.'],
    [
      '413 da API (dimensões)',
      erroAxios(413, { error: 'A imagem tem dimensões grandes demais (máximo de 50 megapixels).' }),
      'A imagem tem dimensões grandes demais (máximo de 50 megapixels).',
    ],
    ['415 sem corpo', erroAxios(415), 'Não foi possível usar este arquivo. Escolha uma foto JPG, PNG ou WebP.'],
    [
      '415 da API (corrompida)',
      erroAxios(415, { error: 'Não foi possível ler a imagem: o arquivo está corrompido ou não é JPEG, PNG ou WebP.' }),
      'Não foi possível ler a imagem: o arquivo está corrompido ou não é JPEG, PNG ou WebP.',
    ],
    ['429', erroAxios(429, { error: 'Muitos envios de imagens.' }), 'Muitos envios em pouco tempo. Aguarde alguns minutos e tente de novo.'],
    ['503', erroAxios(503, { error: 'Indisponível.' }), 'O envio de fotos está indisponível no momento. Tente mais tarde.'],
    ['rede', erroAxios(), 'Não foi possível conectar ao servidor. Verifique sua internet e tente de novo.'],
    ['500 com mensagem', erroAxios(500, { error: 'Erro interno do servidor.' }), 'Erro interno do servidor.'],
    ['500 sem corpo', erroAxios(500), 'Não foi possível enviar a foto. Tente novamente.'],
  ])('erro %s mostra a mensagem certa e mantém o valor', async (_caso, erro, mensagem) => {
    enviar.mockRejectedValue(erro)
    const aoMudar = vi.fn()
    const aoEnviar = vi.fn()
    renderComAntd(<Campo inicial={URL_ANTIGA} aoMudar={aoMudar} aoEnviar={aoEnviar} />)

    await usuario().upload(entrada(), png())

    expect(await screen.findByRole('alert')).toHaveTextContent(mensagem)
    expect(aoMudar).not.toHaveBeenCalled()
    expect(screen.getByRole('img', { name: 'Foto de Rex' })).toHaveAttribute('src', URL_ANTIGA)
    expect(screen.getByRole('button', { name: 'Trocar foto' })).toBeEnabled()
    expect(aoEnviar.mock.calls).toEqual([[true], [false]])
  })

  it('erro que não é do axios usa a mensagem genérica', () => {
    expect(mensagemErroUpload(new Error('qualquer'))).toBe('Não foi possível enviar a foto. Tente novamente.')
  })

  it('durante o envio: "Enviando...", sem remover e sem segundo envio (duplo clique)', async () => {
    let concluir: (url: string) => void = () => undefined
    enviar.mockImplementation(() => new Promise((resolver) => (concluir = resolver)))
    const cliqueNoSeletor = vi.spyOn(HTMLInputElement.prototype, 'click')
    renderComAntd(<Campo inicial={URL_ANTIGA} />)
    const user = usuario()

    await user.upload(entrada(), png())

    const botao = screen.getByRole('button', { name: /Enviando/ })
    expect(screen.getByRole('button', { name: 'Remover foto' })).toBeDisabled()
    cliqueNoSeletor.mockClear()
    await user.dblClick(botao)
    fireEvent.change(entrada(), { target: { files: [png()] } })
    expect(cliqueNoSeletor).not.toHaveBeenCalled()
    expect(enviar).toHaveBeenCalledOnce()

    await act(async () => concluir(URL_NOVA))
    expect(await screen.findByRole('button', { name: 'Trocar foto' })).toBeEnabled()
    expect(screen.getByRole('img', { name: 'Foto de Rex' })).toHaveAttribute('src', URL_NOVA)
  })

  it('remover limpa o valor (null) e a prévia', async () => {
    const aoMudar = vi.fn()
    renderComAntd(<Campo inicial={URL_ANTIGA} aoMudar={aoMudar} />)
    expect(screen.getByRole('img', { name: 'Foto de Rex' })).toHaveAttribute('src', URL_ANTIGA)

    await usuario().click(screen.getByRole('button', { name: 'Remover foto' }))

    expect(aoMudar).toHaveBeenCalledExactlyOnceWith(null)
    expect(screen.queryByRole('img', { name: 'Foto de Rex' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar foto' })).toBeInTheDocument()
    expect(screen.getByText('Foto removida.')).toBeInTheDocument()
  })

  it('URL externa antiga continua sendo exibida', () => {
    renderComAntd(<Campo inicial="https://fotos.exemplo/rex.jpg" />)

    expect(screen.getByRole('img', { name: 'Foto de Rex' })).toHaveAttribute('src', 'https://fotos.exemplo/rex.jpg')
  })

  it('foto atual que não carrega vira aviso, e ainda dá para remover', () => {
    renderComAntd(<Campo inicial={URL_ANTIGA} />)

    fireEvent.error(screen.getByRole('img', { name: 'Foto de Rex' }))

    expect(screen.getByText('Não foi possível carregar a foto atual.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remover foto' })).toBeInTheDocument()
  })

  it('pelo teclado: o botão recebe foco e Enter/Espaço abrem o seletor de arquivos', async () => {
    const cliqueNoSeletor = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined)
    renderComAntd(<Campo />)
    const user = usuario()

    await user.tab()
    expect(screen.getByRole('button', { name: 'Enviar foto' })).toHaveFocus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')

    expect(cliqueNoSeletor).toHaveBeenCalledTimes(2)
    // a entrada de arquivo fica fora da ordem de tabulação
    expect(entrada()).toHaveAttribute('tabindex', '-1')
  })

  it('escolher o mesmo arquivo de novo envia outra vez (a seleção é limpa)', async () => {
    enviar.mockResolvedValue(URL_NOVA)
    renderComAntd(<Campo />)
    const foto = png()

    await usuario().upload(entrada(), foto)
    expect(entrada().value).toBe('')
    await usuario().upload(entrada(), foto)

    expect(enviar).toHaveBeenCalledTimes(2)
  })

  it('cancelar o seletor (nenhum arquivo) não faz nada', () => {
    renderComAntd(<Campo />)

    fireEvent.change(entrada(), { target: { files: [] } })

    expect(enviar).not.toHaveBeenCalled()
    expect(alerta()).not.toBeInTheDocument()
  })

  it('desmontado no meio do envio (modal fechado): ignora o resultado e libera o formulário', async () => {
    let concluir: (url: string) => void = () => undefined
    enviar.mockImplementation(() => new Promise((resolver) => (concluir = resolver)))
    const aoMudar = vi.fn()
    const aoEnviar = vi.fn()
    const { unmount } = renderComAntd(<Campo aoMudar={aoMudar} aoEnviar={aoEnviar} />)

    await usuario().upload(entrada(), png())
    unmount()
    await act(async () => concluir(URL_NOVA))

    expect(aoMudar).not.toHaveBeenCalled()
    expect(aoEnviar.mock.calls).toEqual([[true], [false]])
  })

  it('desmontado no meio de um envio que falha: nada acontece', async () => {
    let falhar: (erro: unknown) => void = () => undefined
    enviar.mockImplementation(() => new Promise((_, rejeitar) => (falhar = rejeitar)))
    const { unmount } = renderComAntd(<Campo />)

    await usuario().upload(entrada(), png())
    unmount()
    await act(async () => falhar(erroAxios(500)))

    expect(enviar).toHaveBeenCalledOnce()
  })

  it('desabilitado (ex.: formulário salvando): botões travados', () => {
    renderComAntd(<CampoImagem value={URL_ANTIGA} textoAlternativo="Foto" disabled />)

    expect(screen.getByRole('button', { name: 'Trocar foto' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Remover foto' })).toBeDisabled()
  })
})

describe('validarArquivoImagem', () => {
  it('devolve null para um arquivo aceito', () => {
    expect(validarArquivoImagem(png())).toBeNull()
  })
})
