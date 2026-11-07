import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FotoAnimal from '../../pages/Publico/FotoAnimal'
import SecaoEventos from '../../pages/Publico/SecaoEventos'
import { listarEventosPublicos } from '../../services/publico'
import type { EventoPublico } from '../../types/publico'
import { renderComAntd } from '../helpers/render'

vi.mock('../../services/publico')

const CAMINHO = '/api/imagens/0f8b2c3d-1e2f-4a5b-8c6d-7e8f9a0b1c2d.webp'

describe('FotoAnimal (cartão e modal da página pública)', () => {
  it.each([
    ['caminho do upload', CAMINHO, CAMINHO],
    ['link externo antigo', 'https://fotos.exemplo/rex.jpg', 'https://fotos.exemplo/rex.jpg'],
  ])('mostra a foto: %s', (_caso, url, src) => {
    render(<FotoAnimal url={url} nome="Rex" />)

    expect(screen.getByRole('img', { name: 'Foto de Rex' })).toHaveAttribute('src', src)
  })

  it.each([null, '', 'javascript:alert(1)'])('sem foto utilizável (%j): imagem padrão', (url) => {
    render(<FotoAnimal url={url} nome="Rex" />)

    expect(screen.getByRole('img', { name: 'Rex (sem foto)' })).toBeInTheDocument()
  })

  it('foto que não carrega vira a imagem padrão', () => {
    render(<FotoAnimal url={CAMINHO} nome="Rex" />)

    fireEvent.error(screen.getByRole('img', { name: 'Foto de Rex' }))

    expect(screen.getByRole('img', { name: 'Rex (sem foto)' })).toBeInTheDocument()
  })
})

describe('SecaoEventos', () => {
  const evento: EventoPublico = {
    id: 'e1',
    titulo: 'Feira de adoção',
    descricao: null,
    data: '2026-11-14',
    horarioInicio: '09:00',
    horarioFim: null,
    local: 'Praça Central',
    imagemUrl: CAMINHO,
  }

  beforeEach(() => {
    vi.mocked(listarEventosPublicos).mockReset()
  })

  it('a capa do evento usa o caminho do upload', async () => {
    vi.mocked(listarEventosPublicos).mockResolvedValue([evento])

    renderComAntd(<SecaoEventos />)

    expect(await screen.findByRole('img', { name: 'Imagem do evento Feira de adoção' })).toHaveAttribute('src', CAMINHO)
  })

  it('imagemUrl inválida não vira <img>', async () => {
    vi.mocked(listarEventosPublicos).mockResolvedValue([{ ...evento, imagemUrl: 'javascript:alert(1)' }])

    renderComAntd(<SecaoEventos />)

    expect(await screen.findByText('Feira de adoção')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Imagem do evento Feira de adoção' })).not.toBeInTheDocument()
  })
})
