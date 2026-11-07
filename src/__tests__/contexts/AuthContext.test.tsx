import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import { lerNome, lerToken, salvarSessao } from '../../utils/armazenamento'
import { chamada, mockarAdapter, respondeErro, respondeOk } from '../helpers/api'
import { tokenDoPerfil } from '../helpers/jwt'
import { LocalAtual } from '../helpers/componentes'
import { renderComAuth } from '../helpers/render'

let erroDoLogin: unknown

function Painel() {
  const { usuario, token, login, logout } = useAuth()
  return (
    <>
      <p data-testid="usuario">{usuario ? `${usuario.nome}/${usuario.perfil}/${usuario.id}` : 'anônimo'}</p>
      <p data-testid="token">{token ?? 'sem token'}</p>
      <button onClick={() => void login('ana@abrigo.org', 'senha').catch((e: unknown) => (erroDoLogin = e))}>entrar</button>
      <button onClick={logout}>sair</button>
      <LocalAtual />
    </>
  )
}

const usuarioNaTela = () => screen.getByTestId('usuario')

beforeEach(() => {
  erroDoLogin = undefined
})

describe('restauração da sessão', () => {
  it('sem token salvo, começa anônimo', () => {
    renderComAuth(<Painel />)

    expect(usuarioNaTela()).toHaveTextContent('anônimo')
  })

  it('restaura do armazenamento, com o perfil vindo do JWT', () => {
    const token = tokenDoPerfil('VOLUNTARIO')
    salvarSessao(token, 'Bia')

    renderComAuth(<Painel />)

    expect(usuarioNaTela()).toHaveTextContent('Bia/VOLUNTARIO/usuario-1')
    expect(screen.getByTestId('token')).toHaveTextContent(token)
  })

  it('usa um nome padrão quando o nome não foi salvo', () => {
    salvarSessao(tokenDoPerfil('ADMIN'), null)

    renderComAuth(<Painel />)

    expect(usuarioNaTela()).toHaveTextContent('Usuário/ADMIN')
  })

  it('descarta o token inválido do armazenamento', () => {
    salvarSessao('token-quebrado', 'Ana')

    renderComAuth(<Painel />)

    expect(usuarioNaTela()).toHaveTextContent('anônimo')
    expect(lerToken()).toBeNull()
    expect(lerNome()).toBeNull()
  })
})

describe('login', () => {
  it('envia as credenciais e abre a sessão', async () => {
    const token = tokenDoPerfil('ADMIN')
    const adapter = mockarAdapter(api)
    adapter.mockImplementation(respondeOk({ token, usuario: { nome: '  Ana  ' } }))
    renderComAuth(<Painel />)

    await userEvent.click(screen.getByRole('button', { name: 'entrar' }))

    expect(chamada(adapter)).toMatchObject({
      metodo: 'post',
      url: '/auth/login',
      corpo: { email: 'ana@abrigo.org', senha: 'senha' },
    })
    expect(usuarioNaTela()).toHaveTextContent('Ana/ADMIN')
    expect(lerToken()).toBe(token)
    expect(lerNome()).toBe('Ana')
  })

  it.each([undefined, { nome: 42 }, { nome: '   ' }])('usa o nome padrão quando a API manda %j', async (usuario) => {
    mockarAdapter(api).mockImplementation(respondeOk({ token: tokenDoPerfil('ADMIN'), usuario }))
    renderComAuth(<Painel />)

    await userEvent.click(screen.getByRole('button', { name: 'entrar' }))

    expect(usuarioNaTela()).toHaveTextContent('Usuário/ADMIN')
  })

  it('recusa token inválido vindo do servidor sem abrir sessão', async () => {
    mockarAdapter(api).mockImplementation(respondeOk({ token: 'quebrado' }))
    renderComAuth(<Painel />)

    await userEvent.click(screen.getByRole('button', { name: 'entrar' }))

    expect(erroDoLogin).toMatchObject({ message: 'Token inválido recebido do servidor.' })
    expect(usuarioNaTela()).toHaveTextContent('anônimo')
    expect(lerToken()).toBeNull()
  })

  it('não abre sessão com credencial inválida', async () => {
    mockarAdapter(api).mockImplementation(respondeErro(401))
    renderComAuth(<Painel />)

    await userEvent.click(screen.getByRole('button', { name: 'entrar' }))

    expect(erroDoLogin).toMatchObject({ response: { status: 401 } })
    expect(usuarioNaTela()).toHaveTextContent('anônimo')
  })
})

describe('logout', () => {
  it('encerra a sessão e limpa o armazenamento', async () => {
    salvarSessao(tokenDoPerfil('ADMIN'), 'Ana')
    renderComAuth(<Painel />)

    await userEvent.click(screen.getByRole('button', { name: 'sair' }))

    expect(usuarioNaTela()).toHaveTextContent('anônimo')
    expect(lerToken()).toBeNull()
  })
})

describe('expiração durante o uso', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('encerra a sessão quando o token expira', () => {
    salvarSessao(tokenDoPerfil('ADMIN', 60), 'Ana')
    renderComAuth(<Painel />)
    expect(usuarioNaTela()).toHaveTextContent('Ana')

    act(() => {
      vi.advanceTimersByTime(61_000)
    })

    expect(usuarioNaTela()).toHaveTextContent('anônimo')
    expect(lerToken()).toBeNull()
  })
})

describe('resposta 401 em requisição autenticada', () => {
  it('sai e volta para o login, lembrando a página atual', async () => {
    salvarSessao(tokenDoPerfil('ADMIN'), 'Ana')
    mockarAdapter(api).mockImplementation(respondeErro(401))
    window.history.pushState({}, '', '/animais?busca=rex')
    renderComAuth(<Painel />, { rota: '/animais' })

    await act(async () => {
      await api.get('/animais').catch(() => undefined)
    })

    expect(usuarioNaTela()).toHaveTextContent('anônimo')
    expect(screen.getByTestId('caminho')).toHaveTextContent('/login')
    expect(screen.getByTestId('estado')).toHaveTextContent('{"from":"/animais?busca=rex"}')
    window.history.pushState({}, '', '/')
  })
})

describe('useAuth', () => {
  it('avisa quando é usado fora do AuthProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(() => render(<Painel />)).toThrow('useAuth deve ser usado dentro de um AuthProvider.')

    vi.restoreAllMocks()
  })
})
