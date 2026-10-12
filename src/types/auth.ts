export type Perfil = 'ADMIN' | 'FUNCIONARIO' | 'VOLUNTARIO'

export const PERFIS: readonly Perfil[] = ['ADMIN', 'FUNCIONARIO', 'VOLUNTARIO']

export const rotulosPerfil: Record<Perfil, string> = {
  ADMIN: 'Coordenadora',
  FUNCIONARIO: 'Funcionário',
  VOLUNTARIO: 'Voluntário',
}

export interface Usuario {
  id: string
  perfil: Perfil
  nome: string
}
