import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import ProtectedRoute from '../../components/ProtectedRoute'
import type { Perfil } from '../../types/auth'
import { salvarSessao } from '../../utils/armazenamento'
import { LocalAtual } from '../helpers/componentes'
import { renderComAuth } from '../helpers/render'
import { tokenDoPerfil, tokenFalso } from '../helpers/jwt'

function logarComo(perfil: Perfil) {
  salvarSessao(tokenDoPerfil(perfil), 'Ana')
}

// Mesma estrutura do App.tsx: rota interna comum, rota só de ADMIN e as telas de destino.
function Rotas() {
  return (
    <>
      <LocalAtual />
      <Routes>
        <Route path="/login" element={<p>Tela de login</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/animais" element={<p>Lista de animais</p>} />
        </Route>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute perfisPermitidos={['ADMIN']}>
              <p>Painel da coordenação</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

describe('sem login', () => {
  it('redireciona para /login e lembra a rota de origem', () => {
    renderComAuth(<Rotas />, { rota: '/dashboard?aba=1#topo' })

    expect(screen.getByText('Tela de login')).toBeInTheDocument()
    expect(screen.queryByText('Painel da coordenação')).not.toBeInTheDocument()
    expect(screen.getByTestId('estado')).toHaveTextContent('{"from":"/dashboard?aba=1#topo"}')
  })

  it('também protege as rotas sem perfil exigido', () => {
    renderComAuth(<Rotas />, { rota: '/animais' })

    expect(screen.getByText('Tela de login')).toBeInTheDocument()
  })

  it('token expirado conta como sem login e é apagado', () => {
    salvarSessao(tokenDoPerfil('ADMIN', -60), 'Ana')

    renderComAuth(<Rotas />, { rota: '/dashboard' })

    expect(screen.getByText('Tela de login')).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('token com perfil desconhecido conta como sem login', () => {
    salvarSessao(tokenFalso({ id: '1', perfil: 'SUPERUSUARIO', iat: 1, exp: 9999999999 }), 'Ana')

    renderComAuth(<Rotas />, { rota: '/dashboard' })

    expect(screen.getByText('Tela de login')).toBeInTheDocument()
  })
})

describe('perfil ADMIN', () => {
  it('acessa a rota restrita', () => {
    logarComo('ADMIN')

    renderComAuth(<Rotas />, { rota: '/dashboard' })

    expect(screen.getByText('Painel da coordenação')).toBeInTheDocument()
  })

  it('acessa as rotas comuns pelo Outlet', () => {
    logarComo('ADMIN')

    renderComAuth(<Rotas />, { rota: '/animais' })

    expect(screen.getByText('Lista de animais')).toBeInTheDocument()
  })
})

describe('perfil sem permissão', () => {
  it('é bloqueado na rota restrita', () => {
    logarComo('VOLUNTARIO')

    renderComAuth(<Rotas />, { rota: '/dashboard' })

    expect(screen.getByText('Acesso negado')).toBeInTheDocument()
    expect(screen.queryByText('Painel da coordenação')).not.toBeInTheDocument()
  })

  it('o botão leva de volta à tela inicial do perfil', async () => {
    logarComo('VOLUNTARIO')
    renderComAuth(<Rotas />, { rota: '/dashboard' })

    await userEvent.click(screen.getByRole('button', { name: 'Voltar para o início' }))

    expect(screen.getByTestId('caminho')).toHaveTextContent('/animais')
    expect(screen.getByText('Lista de animais')).toBeInTheDocument()
  })

  it('acessa normalmente as rotas sem perfil exigido', () => {
    logarComo('VOLUNTARIO')

    renderComAuth(<Rotas />, { rota: '/animais' })

    expect(screen.getByText('Lista de animais')).toBeInTheDocument()
  })
})
