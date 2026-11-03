import type { Especie } from './animal'

export type StatusSolicitacao = 'PENDENTE' | 'EM_CONTATO' | 'APROVADA' | 'RECUSADA'

// Interesses que ainda reservam o animal (EM_ESPERA).
export const STATUS_EM_ANDAMENTO: readonly StatusSolicitacao[] = ['PENDENTE', 'EM_CONTATO']

export const rotulosStatusSolicitacao: Record<StatusSolicitacao, string> = {
  PENDENTE: 'Aguardando contato',
  EM_CONTATO: 'Em contato',
  APROVADA: 'Adoção concluída',
  RECUSADA: 'Não deu certo',
}

export interface AnimalDaSolicitacao {
  id: string
  nome: string
  especie: Especie
  fotoUrl?: string | null
}

// Interesse de adoção (rotas só do ADMIN). Nome e telefone do interessado são dados
// pessoais: ficam só em memória, nunca em console, localStorage ou URL do app.
export interface SolicitacaoAdocao {
  id: string
  nome: string
  // Só dígitos: celular com DDD (11 dígitos). Registros antigos podem ter fixo com 10.
  telefone: string
  status: StatusSolicitacao
  criadoEm: string
  atualizadoEm: string
  animal: AnimalDaSolicitacao | null
}
