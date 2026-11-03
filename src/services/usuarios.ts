import { api } from './api'
import type { DadosTrocaSenha, DadosUsuario, UsuarioSistema } from '../types/usuario'

// Gestão de usuários (somente coordenação). A lista vem inteira e é filtrada na tela.

export async function listarUsuarios() {
  const { data } = await api.get<UsuarioSistema[]>('/usuarios')
  return data
}

export async function criarUsuario(dados: DadosUsuario) {
  const { data } = await api.post<UsuarioSistema>('/usuarios', dados)
  return data
}

// 409 ao desativar, rebaixar ou excluir a si mesmo ou o último ADMIN ativo.
export async function atualizarUsuario(id: string, dados: DadosUsuario) {
  const { data } = await api.put<UsuarioSistema>(`/usuarios/${encodeURIComponent(id)}`, dados)
  return data
}

// 409 também quando o usuário tem registros vinculados (doações, saídas, animais...).
export async function excluirUsuario(id: string) {
  await api.delete(`/usuarios/${encodeURIComponent(id)}`)
}

// Própria senha, qualquer perfil. Senha atual errada = 400 (não 401, para não deslogar).
export async function trocarSenha(dados: DadosTrocaSenha) {
  await api.patch('/usuarios/me/senha', dados)
}
