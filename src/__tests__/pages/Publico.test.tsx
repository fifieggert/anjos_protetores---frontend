import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Publico from '../../pages/Publico/Publico'
import { buscarEstatisticas, listarAnimaisPublicos, listarEventosPublicos } from '../../services/publico'
import type { EventoPublico } from '../../types/publico'
import { erroAxios } from '../helpers/api'
import { renderComAuth } from '../helpers/render'

vi.mock('../../services/publico')

function evento(id: string, titulo: string): EventoPublico {
  return {
    id,
    titulo,
    descricao: 'Venha conhecer os animais.',
    data: '2026-06-16',
    horarioInicio: '09:00',
    horarioFim: null,
    local: 'Praça Central',
    imagemUrl: null,
  }
}

const estatisticas = vi.mocked(buscarEstatisticas)
const eventos = vi.mocked(listarEventosPublicos)

beforeEach(() => {
  estatisticas.mockReset().mockResolvedValue({ animaisAdotados: 1200, animaisDisponiveis: 8, doacoesRecebidas: 45 })
  eventos.mockReset().mockResolvedValue([])
  vi.mocked(listarAnimaisPublicos).mockReset().mockResolvedValue([])
})

describe('título da página', () => {
  it('define o título e a descrição e restaura ao sair', async () => {
    document.title = 'Título anterior'
    const { unmount } = renderComAuth(<Publico />)

    expect(document.title).toContain('Encontre um novo melhor amigo')
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      'content',
      expect.stringContaining('Anjos Protetores'),
    )

    await screen.findByText('Animais adotados')
    unmount()

    expect(document.title).toBe('Título anterior')
    expect(document.querySelector('meta[name="description"]')).not.toBeInTheDocument()
  })
})

describe('números do abrigo', () => {
  it('mostra as estatísticas reais da API', async () => {
    renderComAuth(<Publico />)

    const lista = await screen.findByRole('list', { name: 'O abrigo em números' })
    expect(within(lista).getByText('1.200')).toBeInTheDocument()
    expect(within(lista).getByText('45')).toBeInTheDocument()
    expect(screen.getByText('amigos disponíveis')).toBeInTheDocument()
  })

  it('usa o singular com um animal disponível', async () => {
    estatisticas.mockResolvedValue({ animaisAdotados: 1, animaisDisponiveis: 1, doacoesRecebidas: 1 })

    renderComAuth(<Publico />)

    expect(await screen.findByText('amigo disponível')).toBeInTheDocument()
  })

  it('esconde os números quando a estatística falha, e a página continua funcionando', async () => {
    estatisticas.mockRejectedValue(erroAxios(500))

    renderComAuth(<Publico />)

    await waitFor(() => expect(document.querySelector('.pub-faixa-numeros')).not.toBeInTheDocument())
    expect(screen.queryByRole('list', { name: 'O abrigo em números' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Amigos esperando por você' })).toBeInTheDocument()
  })
})

describe('eventos', () => {
  it('avisa quando não há eventos', async () => {
    renderComAuth(<Publico />)

    expect(await screen.findByText('Nenhum evento agendado no momento. Volte em breve!')).toBeInTheDocument()
  })

  it('mostra erro e permite tentar de novo', async () => {
    eventos.mockRejectedValueOnce(erroAxios(500)).mockResolvedValueOnce([evento('e1', 'Feira de adoção')])
    renderComAuth(<Publico />)

    await screen.findByText('Não foi possível carregar os eventos.')
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByRole('heading', { name: 'Feira de adoção' })).toBeInTheDocument()
  })

  it('mostra os dados do evento', async () => {
    eventos.mockResolvedValue([evento('e1', 'Feira de adoção')])

    renderComAuth(<Publico />)

    await screen.findByRole('heading', { name: 'Feira de adoção' })
    expect(screen.getByText('terça-feira, 16/06/2026')).toBeInTheDocument()
    expect(screen.getByText('a partir das 09:00')).toBeInTheDocument()
    expect(screen.getByText('Praça Central')).toBeInTheDocument()
  })

  it('o carrossel anda pelas setas e pelo teclado, sem passar do fim', async () => {
    eventos.mockResolvedValue([evento('e1', 'Primeiro'), evento('e2', 'Segundo')])
    renderComAuth(<Publico />)
    await screen.findByRole('heading', { name: 'Primeiro' })

    const anterior = screen.getByRole('button', { name: 'Eventos anteriores' })
    const proximo = screen.getByRole('button', { name: 'Próximos eventos' })
    expect(screen.getByText('1–1 de 2')).toBeInTheDocument()
    expect(anterior).toBeDisabled()

    await userEvent.click(proximo)
    expect(screen.getByText('2–2 de 2')).toBeInTheDocument()
    expect(proximo).toBeDisabled()

    await userEvent.click(anterior)
    expect(screen.getByText('1–1 de 2')).toBeInTheDocument()

    const carrossel = document.querySelector<HTMLElement>('[aria-roledescription="carrossel"]')
    carrossel?.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByText('2–2 de 2')).toBeInTheDocument()
    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.getByText('1–1 de 2')).toBeInTheDocument()
  })

  it('com um evento só, não mostra as setas', async () => {
    eventos.mockResolvedValue([evento('e1', 'Único')])

    renderComAuth(<Publico />)

    await screen.findByRole('heading', { name: 'Único' })
    expect(screen.queryByRole('button', { name: 'Próximos eventos' })).not.toBeInTheDocument()
  })
})

describe('contato pelo WhatsApp', () => {
  it('os botões usam o número configurado e a mensagem de doação', async () => {
    renderComAuth(<Publico />)
    await screen.findByText('Animais adotados')

    const links = screen.getAllByRole('link').filter((link) => link.getAttribute('href')?.startsWith('https://wa.me/'))

    expect(links.length).toBeGreaterThan(0)
    expect(links[0]).toHaveAttribute('href', expect.stringContaining('5547999990000'))
  })
})
