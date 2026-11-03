import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, registrarAoNaoAutorizado } from '../services/api'
import { decodificarJwt, tokenExpirado } from '../utils/jwt'
import { lerNome, lerToken, limparSessao, salvarSessao } from '../utils/armazenamento'
import type { Usuario } from '../types/auth'

interface AuthContextValue {
  usuario: Usuario | null
  token: string | null
  carregando: boolean
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
}

interface RespostaLogin {
  token: string
  usuario?: { nome?: unknown }
}

interface Sessao {
  token: string
  usuario: Usuario
  exp: number
}

const NOME_PADRAO = 'Usuário'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Monta a sessão a partir do token. O perfil vem sempre do JWT; o nome vem da
// resposta do login (o token não traz o nome). Retorna null se o token for
// inválido ou estiver expirado.
function criarSessao(token: string, nome: string | null): Sessao | null {
  const payload = decodificarJwt(token)
  if (!payload || tokenExpirado(payload)) return null

  return {
    token,
    exp: payload.exp,
    usuario: { id: payload.id, perfil: payload.perfil, nome: nome || NOME_PADRAO },
  }
}

// Restaura a sessão salva, descartando token inválido ou expirado.
function restaurarSessao(): Sessao | null {
  const token = lerToken()
  if (!token) return null

  const restaurada = criarSessao(token, lerNome())
  if (!restaurada) limparSessao()
  return restaurada
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [sessao, setSessao] = useState<Sessao | null>(restaurarSessao)
  // A restauração lê o localStorage de forma síncrona, então não há espera hoje.
  // Fica true quando a sessão passar a ser validada no backend (ex.: GET /auth/me).
  const carregando = false

  const logout = useCallback(() => {
    limparSessao()
    setSessao(null)
  }, [])

  const login = useCallback(async (email: string, senha: string) => {
    const { data } = await api.post<RespostaLogin>('/auth/login', { email, senha })

    const nomeRecebido = data.usuario?.nome
    const nome = typeof nomeRecebido === 'string' && nomeRecebido.trim() !== '' ? nomeRecebido.trim() : null

    const nova = criarSessao(data.token, nome)
    if (!nova) throw new Error('Token inválido recebido do servidor.')

    salvarSessao(data.token, nome)
    setSessao(nova)
  }, [])

  // Encerra a sessão automaticamente quando o token expira.
  useEffect(() => {
    if (!sessao) return
    const id = window.setTimeout(logout, sessao.exp * 1000 - Date.now())
    return () => window.clearTimeout(id)
  }, [sessao, logout])

  // 401 em requisição autenticada: sai e volta para o login, lembrando a página atual.
  useEffect(
    () =>
      registrarAoNaoAutorizado(() => {
        logout()
        const { pathname, search } = window.location
        navigate('/login', { replace: true, state: { from: pathname + search } })
      }),
    [logout, navigate],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario: sessao?.usuario ?? null,
      token: sessao?.token ?? null,
      carregando,
      login,
      logout,
    }),
    [sessao, carregando, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider.')
  }
  return contexto
}
