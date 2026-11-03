import type { Especie, StatusAnimal } from './animal'
import type { CategoriaItem } from './estoque'
import type { EventoPublico } from './publico'

// Resposta de GET /api/dashboard (somente ADMIN). Formato descrito em docs/dashboard.md
// do backend. Nenhum dado pessoal de interessados em adoção.

export interface AnimaisDoPainel {
  total: number
  // todos os status aparecem, com 0 quando não houver animal
  porStatus: Record<StatusAnimal, number>
  // todas as espécies, na ordem do backend
  porEspecie: { especie: Especie; total: number }[]
}

export interface AdocoesPorMes {
  // "AAAA-MM" (mês no fuso de Brasília)
  mes: string
  total: number
}

export interface AdocoesDoPainel {
  pendentes: number
  emContato: number
  concluidasNoMes: number
  concluidasTotal: number
  // últimos 6 meses, do mais antigo ao atual, com 0 nos meses sem adoção
  porMes: AdocoesPorMes[]
}

export interface ItemCritico {
  id: string
  nomeItem: string
  quantidadeAtual: number
  quantidadeMinima: number
}

export interface EstoqueDoPainel {
  itensAbaixoDoMinimo: number
  // até 5, os mais críticos primeiro
  itens: ItemCritico[]
}

export interface DoacaoRecente {
  id: string
  quantidade: number
  doador: string
  dataEntrada: string
  item: { id: string; nomeItem: string; categoria: CategoriaItem }
}

export interface DoacoesDoPainel {
  // quantidade de registros de doação no mês (não é a soma das quantidades)
  totalNoMes: number
  // até 5, das mais recentes para as mais antigas
  recentes: DoacaoRecente[]
}

export interface Painel {
  animais: AnimaisDoPainel
  adocoes: AdocoesDoPainel
  estoque: EstoqueDoPainel
  doacoes: DoacoesDoPainel
  // até 5 eventos de hoje em diante (mesmos campos do site público)
  eventos: { proximos: EventoPublico[] }
}
