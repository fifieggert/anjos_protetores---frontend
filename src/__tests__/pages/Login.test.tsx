import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import Login from '../../pages/Login/Login'
import { api } from '../../services/api'
import type { Perfil } from '../../types/auth'
import { salvarSessao } from '../../utils/armazenamento'
import { chamada, falhaDeRede, mockarAdapter, respondeErro, respondeOk } from '../helpers/api'
import { tokenDoPerfil } from '../helpers/jwt'
import { LocalAtual } from '../helpers/componentes'
import { renderComAuth } from '../helpers/render'

function Rotas() {
  return (
    <>
      <LocalAtual />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<p>Sistema interno</p>} />
      </Routes>
    </>
  )
}

function abrirLogin(estado?: unknown) {
  renderComAuth(<Rotas />, { rota: { pathname: '/login', state: estado } })
}

const campoEmail = () => screen.getByLabelText('E-mail')
const campoSenha = () => screen.getByLabelText('Senha')
const botaoEntrar = () => screen.getByRole('button', { name: 'Entrar' })

async function preencher(email: string, senha: string) {
  await userEvent.type(campoEmail(), email)
  await userEvent.type(campoSenha(), senha)
  await userEvent.click(botaoEntrar())
}

let adapter: ReturnType<typeof mockarAdapter>

function loginAceito(perfil: Perfil) {
  adapter.mockImplementation(respondeOk({ token: tokenDoPerfil(perfil), usuario: { nome: 'Ana' } }))
}

beforeEach(() => {
  adapter = mockarAdapter(api)
})

describe('renderização', () => {
  it('mostra o formulário e o link para o site público', () => {
    abrirLogin()

    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(campoEmail()).toBeInTheDocument()
    expect(campoSenha()).toHaveAttribute('type', 'password')
    expect(screen.getByRole('link', { name: 'Ver animais disponíveis' })).toHaveAttribute('href', '/')
  })
})

describe('validação', () => {
  it('exige e-mail e senha, sem chamar a API', async () => {
    abrirLogin()

    await userEvent.click(botaoEntrar())

    expect(await screen.findByText('Informe o e-mail.')).toBeInTheDocument()
    expect(await screen.findByText('Informe a senha.')).toBeInTheDocument()
    expect(adapter).not.toHaveBeenCalled()
  })

  it('recusa e-mail inválido', async () => {
    abrirLogin()

    await preencher('nao-e-email', 'minha-senha')

    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(adapter).not.toHaveBeenCalled()
  })
})

describe('envio', () => {
  it('chama a API com o e-mail sem espaços e a senha como foi digitada', async () => {
    loginAceito('ADMIN')
    abrirLogin()

    await preencher('ana@abrigo.org', ' senha com espaço ')

    await waitFor(() => expect(adapter).toHaveBeenCalledOnce())
    expect(chamada(adapter).corpo).toEqual({ email: 'ana@abrigo.org', senha: ' senha com espaço ' })
  })

  it('leva o ADMIN para o Dashboard', async () => {
    loginAceito('ADMIN')
    abrirLogin()

    await preencher('ana@abrigo.org', 'senha')

    await screen.findByText('Sistema interno')
    expect(screen.getByTestId('caminho')).toHaveTextContent('/dashboard')
  })

  it('leva o voluntário para os animais', async () => {
    loginAceito('VOLUNTARIO')
    abrirLogin()

    await preencher('bia@abrigo.org', 'senha')

    await screen.findByText('Sistema interno')
    expect(screen.getByTestId('caminho')).toHaveTextContent('/animais')
  })

  it('volta para a rota de origem guardada pelo ProtectedRoute', async () => {
    loginAceito('ADMIN')
    abrirLogin({ from: '/doacoes?aba=estoque' })

    await preencher('ana@abrigo.org', 'senha')

    await screen.findByText('Sistema interno')
    expect(screen.getByTestId('caminho')).toHaveTextContent('/doacoes?aba=estoque')
  })

  it.each(['https://site-falso.com', '//site-falso.com', '/login', 42])(
    'ignora a origem %s e usa a tela inicial do perfil',
    async (from) => {
      loginAceito('ADMIN')
      abrirLogin({ from })

      await preencher('ana@abrigo.org', 'senha')

      await screen.findByText('Sistema interno')
      expect(screen.getByTestId('caminho')).toHaveTextContent('/dashboard')
    },
  )
})

describe('erros', () => {
  it('mostra erro de credencial inválida e continua na tela', async () => {
    adapter.mockImplementation(respondeErro(401, { error: 'Unauthorized' }))
    abrirLogin()

    await preencher('ana@abrigo.org', 'errada')

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.')
    expect(screen.getByTestId('caminho')).toHaveTextContent('/login')
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('libera o formulário para tentar de novo', async () => {
    adapter.mockImplementation(respondeErro(401))
    abrirLogin()

    await preencher('ana@abrigo.org', 'errada')
    await screen.findByRole('alert')

    expect(campoSenha()).toBeEnabled()
    expect(botaoEntrar()).toBeEnabled()
  })

  it('apaga o erro quando a pessoa volta a digitar', async () => {
    adapter.mockImplementation(respondeErro(401))
    abrirLogin()
    await preencher('ana@abrigo.org', 'errada')
    await screen.findByRole('alert')

    await userEvent.type(campoSenha(), 'x')

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  it('avisa quando o servidor não responde', async () => {
    adapter.mockImplementation(falhaDeRede())
    abrirLogin()

    await preencher('ana@abrigo.org', 'senha')

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar ao servidor.')
  })

  it('mostra erro genérico nos demais casos', async () => {
    adapter.mockImplementation(respondeErro(500))
    abrirLogin()

    await preencher('ana@abrigo.org', 'senha')

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro ao entrar. Tente novamente.')
  })
})

describe('já logado', () => {
  it('não mostra o formulário e segue para a tela inicial do perfil', () => {
    salvarSessao(tokenDoPerfil('VOLUNTARIO'), 'Bia')

    abrirLogin()

    expect(screen.getByText('Sistema interno')).toBeInTheDocument()
    expect(screen.getByTestId('caminho')).toHaveTextContent('/animais')
  })
})
