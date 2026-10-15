export type Especie = 'CACHORRO' | 'GATO' | 'OUTRO'
export type Porte = 'PEQUENO' | 'MEDIO' | 'GRANDE'
export type StatusAnimal = 'DISPONIVEL' | 'EM_TRATAMENTO' | 'ADOTADO'

export const ESPECIES: readonly Especie[] = ['CACHORRO', 'GATO', 'OUTRO']
export const PORTES: readonly Porte[] = ['PEQUENO', 'MEDIO', 'GRANDE']
export const STATUS_ANIMAL: readonly StatusAnimal[] = ['DISPONIVEL', 'EM_TRATAMENTO', 'ADOTADO']

export const rotulosEspecie: Record<Especie, string> = {
  CACHORRO: 'Cachorro',
  GATO: 'Gato',
  OUTRO: 'Outro',
}

export const rotulosPorte: Record<Porte, string> = {
  PEQUENO: 'Pequeno',
  MEDIO: 'Médio',
  GRANDE: 'Grande',
}

export const rotulosStatusAnimal: Record<StatusAnimal, string> = {
  DISPONIVEL: 'Disponível',
  EM_TRATAMENTO: 'Em tratamento',
  ADOTADO: 'Adotado',
}

export interface Animal {
  id: string
  nome: string
  especie: Especie
  raca?: string | null
  idade?: number | null
  porte: Porte
  status: StatusAnimal
  fotoUrl?: string | null
  descricao?: string | null
  criadoEm: string
}

// Corpo aceito por POST/PUT /animais. O servidor rejeita qualquer outro campo.
// null limpa um campo opcional na edição.
export interface DadosAnimal {
  nome?: string
  especie?: Especie
  raca?: string | null
  idade?: number | null
  porte?: Porte
  status?: StatusAnimal
  fotoUrl?: string | null
  descricao?: string | null
}
