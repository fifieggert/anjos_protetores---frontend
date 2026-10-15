import type { Perfil } from './auth'

export type CategoriaItem = 'RACAO' | 'MEDICAMENTO' | 'HIGIENE' | 'LIMPEZA' | 'ACESSORIO'

export const CATEGORIAS: readonly CategoriaItem[] = ['RACAO', 'MEDICAMENTO', 'HIGIENE', 'LIMPEZA', 'ACESSORIO']

export const rotulosCategoria: Record<CategoriaItem, string> = {
  RACAO: 'Ração',
  MEDICAMENTO: 'Medicamento',
  HIGIENE: 'Higiene',
  LIMPEZA: 'Limpeza',
  ACESSORIO: 'Acessório',
}

// Usuário que registrou a movimentação (o backend não envia a senha).
export interface UsuarioResumo {
  id: string
  nome: string
  perfil: Perfil
}

export interface ItemEstoque {
  id: string
  nomeItem: string
  categoria: CategoriaItem
  quantidadeAtual: number
  // 0 = sem alerta de estoque baixo.
  quantidadeMinima: number
  abaixoDoMinimo?: boolean
  criadoEm: string
  // Movimentações do item: com alguma, o banco não deixa excluí-lo.
  doacoes?: unknown[]
  saidas?: unknown[]
}

export interface Doacao {
  id: string
  itemId: string
  item: ItemEstoque | null
  usuarioId: string
  usuario: UsuarioResumo | null
  quantidade: number
  doador: string
  dataEntrada: string
}

export interface SaidaEstoque {
  id: string
  itemId: string
  item: ItemEstoque | null
  usuarioId: string
  usuario: UsuarioResumo | null
  quantidade: number
  finalidade: string
  dataSaida: string
}

// Corpos aceitos pela API. O servidor rejeita qualquer outro campo.
// quantidadeAtual só é aceita no cadastro do item; depois muda só por doações e saídas.
export interface DadosItemEstoque {
  nomeItem?: string
  categoria?: CategoriaItem
  quantidadeAtual?: number
  quantidadeMinima?: number
}

// Item e quantidade não mudam depois do registro: só doador e data.
export interface DadosDoacao {
  itemId?: string
  quantidade?: number
  doador?: string
  dataEntrada?: string
}

// Item e quantidade não mudam depois do registro: só finalidade e data.
export interface DadosSaida {
  itemId?: string
  quantidade?: number
  finalidade?: string
  dataSaida?: string
}
