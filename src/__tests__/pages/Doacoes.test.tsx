import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Doacoes from '../../pages/Doacoes/Doacoes'
import { listarDoacoes, listarItens, listarSaidas } from '../../services/estoque'
import type { ItemEstoque } from '../../types/estoque'
import { salvarSessao } from '../../utils/armazenamento'
import { erroAxios } from '../helpers/api'
import { tokenDoPerfil } from '../helpers/jwt'
import { renderComAuth } from '../helpers/render'

vi.mock('../../services/estoque')

const racao = {
  id: 'i1',
  nomeItem: 'Ração filhote',
  categoria: 'RACAO',
  quantidadeAtual: 5,
  quantidadeMinima: 2,
} as unknown as ItemEstoque

const itens = vi.mocked(listarItens)
const doacoes = vi.mocked(listarDoacoes)
const saidas = vi.mocked(listarSaidas)

beforeEach(() => {
  salvarSessao(tokenDoPerfil('ADMIN'), 'Ana')
  itens.mockReset().mockResolvedValue([racao])
  doacoes.mockReset().mockResolvedValue([])
  saidas.mockReset().mockResolvedValue([])
})

afterEach(() => {
  vi.restoreAllMocks()
})

const carregando = () => document.querySelector('.ant-spin-spinning')

describe('carregamento da tela', () => {
  it('mostra os itens do estoque', async () => {
    renderComAuth(<Doacoes />)

    expect(await screen.findByText('Ração filhote')).toBeInTheDocument()
    expect(carregando()).not.toBeInTheDocument()
  })

  it('mostra a quantidade mínima de cada item com o rótulo "Qtd. mínimo"', async () => {
    renderComAuth(<Doacoes />)

    expect(await screen.findByText('Qtd. mínimo: 2')).toBeInTheDocument()
    expect(screen.queryByText(/mín\./)).not.toBeInTheDocument()
  })

  it('o voluntário não busca as saídas, que são só da coordenação', async () => {
    salvarSessao(tokenDoPerfil('VOLUNTARIO'), 'Bia')

    renderComAuth(<Doacoes />)

    await screen.findByText('Ração filhote')
    expect(saidas).not.toHaveBeenCalled()
  })

  it('uma lista que falha mostra o erro dela e não impede as outras', async () => {
    doacoes.mockRejectedValue(erroAxios(500))

    renderComAuth(<Doacoes />)

    expect(await screen.findByText('Não foi possível carregar as doações.')).toBeInTheDocument()
    expect(screen.getByText('Ração filhote')).toBeInTheDocument()
  })

  it('erro inesperado ao montar a tela vira aviso e encerra o carregamento', async () => {
    vi.spyOn(Promise, 'allSettled').mockRejectedValueOnce(new Error('falha interna'))

    renderComAuth(<Doacoes />)

    expect(await screen.findByText('Não foi possível carregar os dados do estoque.')).toBeInTheDocument()
    await waitFor(() => expect(carregando()).not.toBeInTheDocument())
  })
})
