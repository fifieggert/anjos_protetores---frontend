import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Animais from '../../pages/Animais/Animais'
import ModalEvento from '../../pages/Eventos/ModalEvento'
import { atualizarAnimal, listarAnimais } from '../../services/animais'
import { atualizarEvento } from '../../services/eventos'
import { enviarImagem } from '../../services/imagens'
import type { Animal } from '../../types/animal'
import type { Evento } from '../../types/evento'
import { salvarSessao } from '../../utils/armazenamento'
import { tokenDoPerfil } from '../helpers/jwt'
import { renderComAntd, renderComAuth } from '../helpers/render'

vi.mock('../../services/animais')
vi.mock('../../services/eventos')
vi.mock('../../services/imagens')

const enviar = vi.mocked(enviarImagem)
const URL_NOVA = '/api/imagens/0f8b2c3d-1e2f-4a5b-8c6d-7e8f9a0b1c2d.webp'
const URL_ANTIGA = '/api/imagens/11111111-2222-4333-8444-555555555555.jpg'

const foto = () => new File(['x'], 'foto.webp', { type: 'image/webp' })
const entrada = (dentro: HTMLElement) => within(dentro).getByTestId('entrada-imagem') as HTMLInputElement

// fireEvent em vez de user-event: nestas telas grandes do antd, cada ação do user-event confere
// o CSS de todos os ancestrais e leva segundos. O CampoImagem é testado com user-event no
// teste dele (CampoImagem.test.tsx).
const escolherArquivo = (dentro: HTMLElement, arquivo: File) =>
  act(async () => {
    fireEvent.change(entrada(dentro), { target: { files: [arquivo] } })
  })
const clicar = (elemento: HTMLElement) =>
  act(async () => {
    fireEvent.click(elemento)
  })

beforeEach(() => {
  enviar.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// A tela de Animais (tabela + modal do antd) é pesada no jsdom: só abrir a edição leva alguns
// segundos. Poucos testes, com folga de tempo.
describe('formulário de animal', { timeout: 60_000 }, () => {
  const rex: Animal = {
    id: 'a1',
    nome: 'Rex',
    especie: 'CACHORRO',
    porte: 'MEDIO',
    status: 'DISPONIVEL',
    castrado: false,
    vacinado: false,
    fotoUrl: null,
    criadoEm: '2026-10-01T12:00:00.000Z',
  }

  beforeEach(() => {
    salvarSessao(tokenDoPerfil('VOLUNTARIO'), 'Bia')
    vi.mocked(atualizarAnimal).mockReset()
    vi.mocked(listarAnimais).mockReset()
  })

  async function editar(animal: Animal) {
    vi.mocked(listarAnimais).mockResolvedValue([animal])
    vi.mocked(atualizarAnimal).mockImplementation(async (_id, corpo) => ({ ...animal, ...corpo }) as Animal)
    renderComAuth(<Animais />)
    await clicar(await screen.findByRole('button', { name: `Editar ${animal.nome}` }))
    // no ambiente de teste o antd usa o mesmo id ("test-id") em vários elementos, então o nome
    // acessível do diálogo não é confiável: confere o título pelo texto
    const modal = screen.getByRole('dialog')
    expect(within(modal).getByText('Editar animal')).toBeInTheDocument()
    return modal
  }

  it('troca o campo "URL da foto" pelo upload; salvar espera o envio e grava a url devolvida', async () => {
    let concluir: (url: string) => void = () => undefined
    enviar.mockImplementation(() => new Promise((resolver) => (concluir = resolver)))
    const modal = await editar(rex)
    expect(within(modal).queryByLabelText('URL da foto')).not.toBeInTheDocument()

    await escolherArquivo(modal, foto())
    // enquanto a foto sobe, salvar fica desabilitado (senão o animal iria sem ela)
    expect(within(modal).getByRole('button', { name: 'Salvar' })).toBeDisabled()
    await act(async () => concluir(URL_NOVA))

    expect(await within(modal).findByRole('img', { name: 'Foto de Rex' })).toHaveAttribute('src', URL_NOVA)
    await waitFor(() => expect(within(modal).getByRole('button', { name: 'Salvar' })).toBeEnabled())
    await clicar(within(modal).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(atualizarAnimal).toHaveBeenCalledOnce())
    expect(vi.mocked(atualizarAnimal).mock.calls[0]).toEqual(['a1', expect.objectContaining({ fotoUrl: URL_NOVA })])
  })

  it('remover a foto salva fotoUrl: null (o servidor limpa o campo)', async () => {
    const modal = await editar({ ...rex, fotoUrl: URL_ANTIGA })
    expect(within(modal).getByRole('img', { name: 'Foto de Rex' })).toHaveAttribute('src', URL_ANTIGA)

    await clicar(within(modal).getByRole('button', { name: 'Remover foto' }))
    await clicar(within(modal).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(atualizarAnimal).toHaveBeenCalledOnce())
    expect(vi.mocked(atualizarAnimal).mock.calls[0]?.[1]).toMatchObject({ fotoUrl: null })
  })

  it('sem mexer na foto, a URL externa antiga é mantida', async () => {
    const modal = await editar({ ...rex, fotoUrl: 'https://fotos.exemplo/rex.jpg' })
    expect(within(modal).getByRole('img', { name: 'Foto de Rex' })).toHaveAttribute('src', 'https://fotos.exemplo/rex.jpg')

    await clicar(within(modal).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(atualizarAnimal).toHaveBeenCalledOnce())
    expect(vi.mocked(atualizarAnimal).mock.calls[0]?.[1]).toMatchObject({ fotoUrl: 'https://fotos.exemplo/rex.jpg' })
  })

  it('a tabela mostra a foto enviada pelo caminho interno', async () => {
    vi.mocked(listarAnimais).mockResolvedValue([{ ...rex, fotoUrl: URL_ANTIGA }])

    renderComAuth(<Animais />)

    expect(await screen.findByRole('img', { name: 'Rex' })).toHaveAttribute('src', URL_ANTIGA)
  })
})

describe('formulário de evento', () => {
  const feira: Evento = {
    id: 'e1',
    titulo: 'Feira de adoção',
    descricao: null,
    data: '2026-11-14',
    horarioInicio: '09:00',
    horarioFim: null,
    local: 'Praça central',
    imagemUrl: null,
  } as Evento

  beforeEach(() => {
    vi.mocked(atualizarEvento).mockReset()
  })

  function abrir(evento: Evento) {
    vi.mocked(atualizarEvento).mockImplementation(async (_id, corpo) => ({ ...evento, ...corpo }) as Evento)
    const onSalvo = vi.fn()
    renderComAntd(
      <ModalEvento aberto evento={evento} onFechar={vi.fn()} onSalvo={onSalvo} onDesatualizado={vi.fn()} />,
    )
    const modal = screen.getByRole('dialog')
    expect(within(modal).getByText('Editar evento')).toBeInTheDocument()
    return { modal, onSalvo }
  }

  it('troca o campo "URL da imagem" pelo upload e salva com a url devolvida', async () => {
    enviar.mockResolvedValue(URL_NOVA)
    const { modal, onSalvo } = abrir(feira)
    expect(within(modal).queryByLabelText('URL da imagem')).not.toBeInTheDocument()

    await escolherArquivo(modal, foto())
    expect(await within(modal).findByRole('img', { name: 'Imagem do evento Feira de adoção' })).toHaveAttribute(
      'src',
      URL_NOVA,
    )
    await clicar(within(modal).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(atualizarEvento).toHaveBeenCalledOnce())
    // edição envia só o que mudou
    expect(vi.mocked(atualizarEvento).mock.calls[0]).toEqual(['e1', { imagemUrl: URL_NOVA }])
    expect(onSalvo).toHaveBeenCalledWith(expect.objectContaining({ imagemUrl: URL_NOVA }), false)
  })

  it('remover a imagem salva imagemUrl: null', async () => {
    const { modal } = abrir({ ...feira, imagemUrl: URL_ANTIGA })

    await clicar(within(modal).getByRole('button', { name: 'Remover foto' }))
    await clicar(within(modal).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(atualizarEvento).toHaveBeenCalledOnce())
    expect(vi.mocked(atualizarEvento).mock.calls[0]).toEqual(['e1', { imagemUrl: null }])
  })

  it('erro no upload não altera a imagem e o evento não é salvo', async () => {
    enviar.mockRejectedValue(Object.assign(new Error('x'), { isAxiosError: true, response: { status: 503, data: null } }))
    const { modal } = abrir(feira)

    await escolherArquivo(modal, foto())

    expect(await within(modal).findByRole('alert')).toHaveTextContent(
      'O envio de fotos está indisponível no momento. Tente mais tarde.',
    )
    expect(atualizarEvento).not.toHaveBeenCalled()
  })
})
