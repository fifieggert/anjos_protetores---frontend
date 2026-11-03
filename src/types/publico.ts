import type { Especie, Porte, Sexo } from './animal'

// Animal da página pública: só os disponíveis, sem dados internos.
export interface AnimalPublico {
  id: string
  nome: string
  especie: Especie
  raca: string | null
  idade: number | null
  porte: Porte
  sexo: Sexo | null
  castrado: boolean
  vacinado: boolean
  descricao: string | null
  fotoUrl: string | null
}

export interface FiltrosAnimaisPublicos {
  especie?: Especie
  porte?: Porte
}

// Eventos de hoje em diante (até 12).
export interface EventoPublico {
  id: string
  titulo: string
  descricao: string | null
  // Somente o dia, "AAAA-MM-DD" (ler com diaDaApi).
  data: string
  horarioInicio: string
  horarioFim: string | null
  local: string
  imagemUrl: string | null
}

export interface EstatisticasPublicas {
  animaisAdotados: number
  animaisDisponiveis: number
  doacoesRecebidas: number
}

// Formulário "Tenho interesse". Nome e telefone são dados pessoais: ficam só em
// memória durante o envio, nunca em console, armazenamento do navegador ou URL.
export interface DadosInteresse {
  animalId: string
  nome: string
  // Somente os 11 dígitos (DDD + celular).
  telefone: string
  aceitaContato: true
}

export interface RespostaInteresse {
  mensagem: string
}
