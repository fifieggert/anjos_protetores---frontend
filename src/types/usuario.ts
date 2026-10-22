import type { Perfil } from './auth'

// Limites do backend (validados também no formulário).
export const LIMITES_USUARIO = {
  textoMax: 191,
  cpfDigitos: 11,
  senhaMin: 8,
  // o bcrypt só considera os primeiros 72 bytes
  senhaMaxBytes: 72,
} as const

// Usuário do sistema (rotas só do ADMIN). O backend nunca envia a senha nem o hash.
export interface UsuarioSistema {
  id: string
  nome: string
  // Só os 11 dígitos.
  cpf: string
  email: string
  perfil: Perfil
  ativo: boolean
  criadoEm: string
}

// Cadastro: todos os campos (senha obrigatória). Edição: só o que mudou; senha só
// quando a coordenação redefine a senha de alguém.
export interface DadosUsuario {
  nome?: string
  cpf?: string
  email?: string
  senha?: string
  perfil?: Perfil
  ativo?: boolean
}

export interface DadosTrocaSenha {
  senhaAtual: string
  novaSenha: string
}
