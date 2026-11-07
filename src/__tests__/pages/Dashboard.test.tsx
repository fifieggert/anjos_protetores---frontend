import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Dashboard from '../../pages/Dashboard/Dashboard'
import { buscarPainel } from '../../services/dashboard'
import type { Painel } from '../../types/dashboard'
import { erroAxios } from '../helpers/api'
import { LocalAtual } from '../helpers/componentes'
import { renderComRota } from '../helpers/render'

vi.mock('../../services/dashboard')

const painel: Painel = {
  animais: {
    total: 1234,
    porStatus: { DISPONIVEL: 1000, EM_TRATAMENTO: 200, EM_ESPERA: 30, ADOTADO: 4 },
    porEspecie: [
      { especie: 'CACHORRO', total: 900 },
      { especie: 'GATO', total: 334 },
    ],
  },
  adocoes: {
    pendentes: 7,
    emContato: 2,
    concluidasNoMes: 3,
    concluidasTotal: 58,
    porMes: [
      { mes: '2026-05', total: 1 },
      { mes: '2026-06', total: 3 },
    ],
  },
  estoque: {
    itensAbaixoDoMinimo: 3,
    itens: [
      { id: 'i1', nomeItem: 'Ração filhote', quantidadeAtual: 0, quantidadeMinima: 10 },
      { id: 'i2', nomeItem: 'Areia', quantidadeAtual: 3, quantidadeMinima: 12 },
    ],
  },
  doacoes: {
    totalNoMes: 9,
    recentes: [
      {
        id: 'd1',
        quantidade: 1500,
        doador: 'Mercado Central',
        dataEntrada: '2026-06-10T15:00:00.000Z',
        item: { id: 'i1', nomeItem: 'Ração', categoria: 'RACAO' },
      },
    ],
  },
  eventos: {
    proximos: [
      {
        id: 'e1',
        titulo: 'Feira de adoção',
        descricao: null,
        data: '2026-10-03',
        horarioInicio: '09:00',
        horarioFim: '16:00',
        local: 'Parque Ramiro',
        imagemUrl: null,
      },
    ],
  },
}

const painelVazio: Painel = {
  ...painel,
  estoque: { itensAbaixoDoMinimo: 0, itens: [] },
  doacoes: { totalNoMes: 0, recentes: [] },
  eventos: { proximos: [] },
}

// Promessa resolvida à mão, para ver a tela enquanto a resposta não chega.
function adiada<T>() {
  let resolver!: (valor: T) => void
  let rejeitar!: (erro: unknown) => void
  const promessa = new Promise<T>((res, rej) => {
    resolver = res
    rejeitar = rej
  })
  return { promessa, resolver, rejeitar }
}

function abrir() {
  renderComRota(
    <>
      <LocalAtual />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="*" element={<p>Outra tela</p>} />
      </Routes>
    </>,
  )
}

function cartao(titulo: string) {
  const elemento = screen.getByText(titulo).closest('.ant-card')
  if (!(elemento instanceof HTMLElement)) throw new Error(`Cartão "${titulo}" não encontrado.`)
  return within(elemento)
}

const buscar = vi.mocked(buscarPainel)

beforeEach(() => {
  buscar.mockReset()
})

describe('carregando', () => {
  it('mostra os esqueletos enquanto a resposta não chega', () => {
    buscar.mockReturnValue(adiada<Painel>().promessa)

    abrir()

    expect(document.querySelectorAll('.ant-skeleton').length).toBeGreaterThan(0)
    expect(screen.queryByText('Animais cadastrados')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument()
  })
})

describe('erro', () => {
  it('mostra a mensagem da API', async () => {
    buscar.mockRejectedValue(erroAxios(500, { error: 'Banco fora do ar.' }))

    abrir()

    expect(await screen.findByText('Banco fora do ar.')).toBeInTheDocument()
    expect(document.querySelector('.ant-skeleton')).not.toBeInTheDocument()
  })

  it('usa a mensagem padrão quando a API não informa o motivo', async () => {
    buscar.mockRejectedValue(erroAxios(500))

    abrir()

    expect(await screen.findByText('Não foi possível carregar o painel.')).toBeInTheDocument()
  })

  it('avisa quando o servidor não responde', async () => {
    buscar.mockRejectedValue(erroAxios())

    abrir()

    expect(await screen.findByText('Não foi possível conectar ao servidor. Tente novamente.')).toBeInTheDocument()
  })

  it('"Tentar novamente" busca de novo e mostra os dados', async () => {
    buscar.mockRejectedValueOnce(erroAxios(500)).mockResolvedValueOnce(painel)
    abrir()

    await userEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByText('Animais cadastrados')).toBeInTheDocument()
    expect(buscar).toHaveBeenCalledTimes(2)
  })
})

describe('dados', () => {
  beforeEach(() => {
    buscar.mockResolvedValue(painel)
  })

  it('mostra os números principais', async () => {
    abrir()
    await screen.findByText('Animais cadastrados')

    expect(cartao('Animais cadastrados').getByText('1.234')).toBeInTheDocument()
    expect(cartao('Solicitações pendentes').getByText('7')).toBeInTheDocument()
    expect(cartao('Em contato').getByText('2')).toBeInTheDocument()
    expect(cartao('Adoções no mês').getByText('3')).toBeInTheDocument()
    expect(cartao('Adoções no total').getByText('58')).toBeInTheDocument()
  })

  it('mostra animais por status e por espécie', async () => {
    abrir()
    await screen.findByText('Animais cadastrados')

    expect(screen.getByLabelText('Reservado: 30 animais')).toBeInTheDocument()
    expect(screen.getByLabelText('Disponível: 1.000 animais')).toBeInTheDocument()
    expect(screen.getByText('Cachorro:').closest('.ant-tag')).toHaveTextContent('Cachorro: 900')
  })

  it('o gráfico recebe os meses do painel', async () => {
    abrir()

    expect(await screen.findByRole('listitem', { name: 'jun/26: 3 adoções' })).toBeInTheDocument()
  })

  it('destaca os itens em estoque baixo e diz quantos ficaram de fora da lista', async () => {
    abrir()
    await screen.findByText('Animais cadastrados')
    const estoque = cartao('Estoque baixo')

    expect(estoque.getByText('3 itens abaixo do mínimo')).toBeInTheDocument()
    expect(estoque.getByText('esgotado')).toBeInTheDocument()
    expect(estoque.getByText('3 de 12')).toBeInTheDocument()
    expect(estoque.getByText('e mais 1')).toBeInTheDocument()
  })

  it('mostra as doações recentes', async () => {
    abrir()
    await screen.findByText('Animais cadastrados')
    const doacoes = cartao('Mais recentes')

    expect(doacoes.getByText('Mercado Central')).toBeInTheDocument()
    expect(doacoes.getByText('10/06/2026')).toBeInTheDocument()
    expect(doacoes.getByText('1.500 × Ração')).toBeInTheDocument()
  })

  it('mostra os próximos eventos', async () => {
    abrir()
    await screen.findByText('Animais cadastrados')

    expect(screen.getByText('Feira de adoção')).toBeInTheDocument()
    expect(screen.getByText('03/10/2026, 09:00 às 16:00')).toBeInTheDocument()
    expect(screen.getByText('Parque Ramiro')).toBeInTheDocument()
  })

  it('"Ver estoque" abre a tela de doações já filtrando o estoque baixo', async () => {
    abrir()
    await screen.findByText('Animais cadastrados')

    await userEvent.click(screen.getByRole('link', { name: 'Ver estoque' }))

    expect(screen.getByTestId('caminho')).toHaveTextContent('/doacoes')
    expect(screen.getByTestId('estado')).toHaveTextContent('{"verEstoqueBaixo":true}')
  })
})

describe('listas vazias', () => {
  beforeEach(() => {
    buscar.mockResolvedValue(painelVazio)
  })

  it('mostra as mensagens de vazio nas seções', async () => {
    abrir()
    await screen.findByText('Animais cadastrados')

    expect(screen.getByText('Nenhum item abaixo do mínimo.')).toBeInTheDocument()
    expect(screen.getByText('Nenhuma doação registrada ainda.')).toBeInTheDocument()
    expect(screen.getByText('Nenhum evento programado.')).toBeInTheDocument()
  })

  it('sem estoque baixo, "Ver estoque" não aplica o filtro', async () => {
    abrir()
    await screen.findByText('Animais cadastrados')

    await userEvent.click(screen.getByRole('link', { name: 'Ver estoque' }))

    expect(screen.getByTestId('estado')).toHaveTextContent('{"verEstoqueBaixo":false}')
  })
})

describe('botão Atualizar', () => {
  it('troca os números pelos novos', async () => {
    buscar
      .mockResolvedValueOnce(painel)
      .mockResolvedValueOnce({ ...painel, adocoes: { ...painel.adocoes, pendentes: 99 } })
    abrir()
    await screen.findByText('Animais cadastrados')

    await userEvent.click(screen.getByRole('button', { name: /Atualizar/ }))

    expect(await screen.findByText('99')).toBeInTheDocument()
  })

  it('mantém os números na tela enquanto atualiza, sem voltar aos esqueletos', async () => {
    const segunda = adiada<Painel>()
    buscar.mockResolvedValueOnce(painel).mockReturnValueOnce(segunda.promessa)
    abrir()
    await screen.findByText('Animais cadastrados')

    await userEvent.click(screen.getByRole('button', { name: /Atualizar/ }))

    expect(cartao('Animais cadastrados').getByText('1.234')).toBeInTheDocument()
    expect(document.querySelector('.ant-skeleton')).not.toBeInTheDocument()
  })

  it('se falhar, mantém os números anteriores e avisa que podem estar desatualizados', async () => {
    buscar.mockResolvedValueOnce(painel).mockRejectedValueOnce(erroAxios(500, { error: 'Falhou.' }))
    abrir()
    await screen.findByText('Animais cadastrados')

    await userEvent.click(screen.getByRole('button', { name: /Atualizar/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Falhou. Os números abaixo podem estar desatualizados.')
    expect(cartao('Animais cadastrados').getByText('1.234')).toBeInTheDocument()
  })

  it('o aviso some depois de atualizar com sucesso', async () => {
    buscar
      .mockResolvedValueOnce(painel)
      .mockRejectedValueOnce(erroAxios(500))
      .mockResolvedValueOnce(painel)
    abrir()
    await screen.findByText('Animais cadastrados')
    await userEvent.click(screen.getByRole('button', { name: /Atualizar/ }))
    const alerta = await screen.findByRole('alert')

    await userEvent.click(within(alerta).getByRole('button', { name: 'Tentar novamente' }))

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  it('só a busca mais recente muda a tela, mesmo que a antiga responda depois', async () => {
    const antiga = adiada<Painel>()
    const nova = adiada<Painel>()
    buscar
      .mockResolvedValueOnce(painel)
      .mockReturnValueOnce(antiga.promessa)
      .mockReturnValueOnce(nova.promessa)
    abrir()
    await screen.findByText('Animais cadastrados')
    const atualizar = screen.getByRole('button', { name: /Atualizar/ })
    // dois cliques no mesmo instante, antes de o botão entrar em "loading"
    atualizar.click()
    atualizar.click()
    await waitFor(() => expect(buscar).toHaveBeenCalledTimes(3))

    nova.resolver({ ...painel, adocoes: { ...painel.adocoes, pendentes: 50 } })
    await screen.findByText('50')
    // dentro do act: garante que o React já renderizou quando a tela for conferida
    await act(async () => {
      antiga.resolver({ ...painel, adocoes: { ...painel.adocoes, pendentes: 11 } })
      await antiga.promessa
    })

    expect(screen.queryByText('11')).not.toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
  })
})
