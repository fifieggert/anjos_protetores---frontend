export type PeriodoEvento = 'proximos' | 'passados' | 'todos'

// Limites do backend (validados também no formulário).
export const LIMITES_EVENTO = {
  tituloMin: 3,
  tituloMax: 100,
  descricaoMax: 1000,
  localMin: 2,
  localMax: 191,
  imagemUrlMax: 500,
} as const

export interface CriadorEvento {
  id: string
  nome: string
}

// Evento do abrigo (rotas só do ADMIN). Aparece na página pública.
export interface Evento {
  id: string
  titulo: string
  descricao: string | null
  // Somente o dia, "AAAA-MM-DD" (ler com diaDaApi).
  data: string
  // "HH:mm"; o término, quando houver, é depois do início.
  horarioInicio: string
  horarioFim: string | null
  local: string
  imagemUrl: string | null
  criadoPor: CriadorEvento | null
  criadoEm: string
  atualizadoEm: string
}

// Corpo aceito por POST/PUT /eventos. O servidor rejeita qualquer outro campo
// (criadoPor vem do token). null limpa um campo opcional na edição.
export interface DadosEvento {
  titulo?: string
  descricao?: string | null
  // Enviar com diaParaApi.
  data?: string
  horarioInicio?: string
  horarioFim?: string | null
  local?: string
  imagemUrl?: string | null
}
