import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { api, apiPublica } from '../services/api'
import type { Perfil } from '../types/auth'
import { salvarSessao } from '../utils/armazenamento'
import { mockarAdapter, respondeErro, respondeOk } from './helpers/api'
import { tokenDoPerfil } from './helpers/jwt'
import { ProvedoresAntd } from './helpers/componentes'

// Teste de integração das rotas: App real, só o HTTP é falso.
const painel = {
  animais: { total: 12, porStatus: { DISPONIVEL: 12, EM_TRATAMENTO: 0, EM_ESPERA: 0, ADOTADO: 0 }, porEspecie: [] },
  adocoes: { pendentes: 0, emContato: 0, concluidasNoMes: 0, concluidasTotal: 0, porMes: [] },
  estoque: { itensAbaixoDoMinimo: 0, itens: [] },
  doacoes: { totalNoMes: 0, recentes: [] },
  eventos: { proximos: [] },
}

let alertas: unknown[]

function responder(config: InternalAxiosRequestConfig) {
  if (config.url === '/dashboard') return respondeOk(painel)(config)
  if (config.url === '/itens-estoque/alertas') return respondeOk(alertas)(config)
  if (config.url === '/publico/estatisticas') {
    return respondeOk({ animaisAdotados: 1, animaisDisponiveis: 1, doacoesRecebidas: 1 })(config)
  }
  return respondeOk([])(config)
}

function abrir(caminho: string, perfil?: Perfil) {
  if (perfil) salvarSessao(tokenDoPerfil(perfil), 'Ana Souza')
  window.history.pushState({}, '', caminho)
  render(
    <ProvedoresAntd>
      <App />
    </ProvedoresAntd>,
  )
}

beforeEach(() => {
  alertas = []
  mockarAdapter(api).mockImplementation(responder)
  mockarAdapter(apiPublica).mockImplementation(responder)
})

afterEach(() => {
  window.history.pushState({}, '', '/')
})

describe('rotas públicas', () => {
  it('a página inicial abre sem login', async () => {
    abrir('/')

    expect(await screen.findByRole('heading', { name: 'Amigos esperando por você' })).toBeInTheDocument()
  })

  it('/publico redireciona para a página inicial', async () => {
    abrir('/publico')

    await screen.findByRole('heading', { name: 'Amigos esperando por você' })
    expect(window.location.pathname).toBe('/')
  })

  it('rota inexistente volta para a página inicial', async () => {
    abrir('/nao-existe')

    await screen.findByRole('heading', { name: 'Amigos esperando por você' })
    expect(window.location.pathname).toBe('/')
  })
})

describe('rotas internas sem login', () => {
  it.each(['/dashboard', '/animais', '/doacoes', '/adocoes', '/eventos', '/usuarios'])('%s leva ao login', async (rota) => {
    abrir(rota)

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })
})

describe('permissões por perfil', () => {
  it.each(['/dashboard', '/adocoes', '/eventos', '/usuarios'])('voluntário é bloqueado em %s', async (rota) => {
    abrir(rota, 'VOLUNTARIO')

    expect(await screen.findByText('Acesso negado')).toBeInTheDocument()
  })

  it('a coordenação abre o Dashboard', async () => {
    abrir('/dashboard', 'ADMIN')

    expect(await screen.findByText('Animais cadastrados')).toBeInTheDocument()
    expect(screen.queryByText('Acesso negado')).not.toBeInTheDocument()
  })
})

describe('login completo', () => {
  it('voluntário entra e cai na lista de animais', async () => {
    const adapter = mockarAdapter(api)
    adapter.mockImplementation((config) =>
      config.url === '/auth/login'
        ? respondeOk({ token: tokenDoPerfil('VOLUNTARIO'), usuario: { nome: 'Bia' } })(config)
        : responder(config),
    )
    abrir('/login')

    await userEvent.type(screen.getByLabelText('E-mail'), 'bia@abrigo.org')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha-de-teste')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await screen.findByRole('button', { name: 'Abrir menu' })
    expect(window.location.pathname).toBe('/animais')
  })

  it('sessão que expira no servidor (401) volta ao login', async () => {
    mockarAdapter(api).mockImplementation((config) =>
      config.url === '/dashboard' ? respondeErro(401)(config) : responder(config),
    )

    abrir('/dashboard', 'ADMIN')

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
  })
})

describe('menu lateral', () => {
  async function abrirMenu() {
    await userEvent.click(await screen.findByRole('button', { name: 'Abrir menu' }))
    return within(await screen.findByRole('menu'))
  }

  it('a coordenação vê todos os itens', async () => {
    abrir('/animais', 'ADMIN')

    const menu = await abrirMenu()

    for (const item of ['Dashboard', 'Animais', 'Doações', 'Adoções', 'Eventos', 'Usuários', 'Área Pública']) {
      expect(menu.getByRole('menuitem', { name: new RegExp(item) })).toBeInTheDocument()
    }
  })

  it('o voluntário não vê os itens exclusivos da coordenação', async () => {
    abrir('/animais', 'VOLUNTARIO')

    const menu = await abrirMenu()

    expect(menu.getByRole('menuitem', { name: /Animais/ })).toBeInTheDocument()
    expect(menu.getByRole('menuitem', { name: /Doações/ })).toBeInTheDocument()
    for (const item of ['Dashboard', 'Adoções', 'Eventos', 'Usuários']) {
      expect(menu.queryByRole('menuitem', { name: new RegExp(item) })).not.toBeInTheDocument()
    }
  })

  it('o card de estoque mostra os itens mais críticos', async () => {
    alertas = [
      { id: '1', nomeItem: 'Areia', quantidadeAtual: 5, quantidadeMinima: 10 },
      { id: '2', nomeItem: 'Ração', quantidadeAtual: 0, quantidadeMinima: 10 },
    ]
    abrir('/animais', 'ADMIN')

    await abrirMenu()

    const card = await screen.findByRole('button', { name: 'Ver itens com estoque baixo' })
    expect(within(card).getByText('Estoque baixo')).toBeInTheDocument()
    expect(card.textContent?.indexOf('Ração')).toBeLessThan(card.textContent?.indexOf('Areia') ?? -1)
  })

  it('sem alertas, o card diz que o estoque está em dia', async () => {
    abrir('/animais', 'ADMIN')

    await abrirMenu()

    expect(await screen.findByText('Estoque em dia')).toBeInTheDocument()
  })

  it('o botão Sair encerra a sessão', async () => {
    abrir('/animais', 'ADMIN')
    await abrirMenu()

    await userEvent.click(await screen.findByRole('button', { name: /Sair/ }))

    expect(localStorage.getItem('token')).toBeNull()
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })
})
