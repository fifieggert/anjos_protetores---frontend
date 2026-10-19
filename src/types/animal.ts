export type Especie = 'CACHORRO' | 'GATO' | 'OUTRO'
export type Porte = 'PEQUENO' | 'MEDIO' | 'GRANDE'
// EM_ESPERA = reservado por um interesse de adoção. EM_ESPERA e ADOTADO só mudam pelo
// fluxo de adoção; o cadastro e a edição só enviam DISPONIVEL ou EM_TRATAMENTO.
export type StatusAnimal = 'DISPONIVEL' | 'EM_TRATAMENTO' | 'EM_ESPERA' | 'ADOTADO'
export type StatusEditavel = Extract<StatusAnimal, 'DISPONIVEL' | 'EM_TRATAMENTO'>
export type Sexo = 'MACHO' | 'FEMEA'

export const ESPECIES: readonly Especie[] = ['CACHORRO', 'GATO', 'OUTRO']
export const PORTES: readonly Porte[] = ['PEQUENO', 'MEDIO', 'GRANDE']
export const STATUS_ANIMAL: readonly StatusAnimal[] = ['DISPONIVEL', 'EM_TRATAMENTO', 'EM_ESPERA', 'ADOTADO']
export const STATUS_EDITAVEIS: readonly StatusEditavel[] = ['DISPONIVEL', 'EM_TRATAMENTO']
export const SEXOS: readonly Sexo[] = ['MACHO', 'FEMEA']

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
  EM_ESPERA: 'Reservado',
  ADOTADO: 'Adotado',
}

export const rotulosSexo: Record<Sexo, string> = {
  MACHO: 'Macho',
  FEMEA: 'Fêmea',
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
  sexo?: Sexo | null
  castrado?: boolean
  // Datas "só dia" (ver diaDaApi/diaParaApi em utils/datas.ts).
  dataCastracao?: string | null
  vacinado?: boolean
  dosesVacina?: number | null
  dataRevacinacao?: string | null
  criadoEm: string
}

// Corpo aceito por POST/PUT /animais. O servidor rejeita qualquer outro campo.
// null limpa um campo opcional na edição. Com castrado/vacinado false, o servidor
// recusa as datas e doses correspondentes (e as limpa ao desmarcar).
export interface DadosAnimal {
  nome?: string
  especie?: Especie
  raca?: string | null
  idade?: number | null
  porte?: Porte
  status?: StatusEditavel
  fotoUrl?: string | null
  descricao?: string | null
  sexo?: Sexo | null
  castrado?: boolean
  dataCastracao?: string | null
  vacinado?: boolean
  dosesVacina?: number | null
  dataRevacinacao?: string | null
}
