export type Perfil = 'ADMIN' | 'VOLUNTARIO'

export const PERFIS: readonly Perfil[] = ['ADMIN', 'VOLUNTARIO']

export const rotulosPerfil: Record<Perfil, string> = {
  ADMIN: 'Coordenadora',
  VOLUNTARIO: 'Voluntário',
}

export interface Usuario {
  id: string
  perfil: Perfil
  nome: string
}
