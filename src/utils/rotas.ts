import type { Perfil } from '../types/auth'

// Tela inicial de cada perfil no sistema interno: a coordenação (ADMIN) abre no Dashboard,
// que é só dela; o voluntário abre na lista de animais.
export function rotaInicial(perfil: Perfil) {
  return perfil === 'ADMIN' ? '/dashboard' : '/animais'
}
