import { api } from './api'
import type {
  DadosDoacao,
  DadosItemEstoque,
  DadosSaida,
  Doacao,
  ItemEstoque,
  SaidaEstoque,
} from '../types/estoque'

// Aviso de estoque alterado
// Evento de janela disparado após cada mudança que pode alterar saldo ou mínimo de um item.
// O card "Estoque baixo" do menu escuta este evento para se atualizar sem recarregar a página.

const EVENTO_ESTOQUE_ALTERADO = 'estoque-alterado'

function avisarEstoqueAlterado() {
  window.dispatchEvent(new Event(EVENTO_ESTOQUE_ALTERADO))
}

// Retorna a função que cancela a inscrição.
export function aoAlterarEstoque(callback: () => void) {
  window.addEventListener(EVENTO_ESTOQUE_ALTERADO, callback)
  return () => window.removeEventListener(EVENTO_ESTOQUE_ALTERADO, callback)
}

// Itens de estoque

export async function listarItens() {
  const { data } = await api.get<ItemEstoque[]>('/itens-estoque')
  return data
}

// Itens abaixo do mínimo (quantidadeMinima > 0), em ordem alfabética.
export async function listarAlertas() {
  const { data } = await api.get<ItemEstoque[]>('/itens-estoque/alertas')
  return data
}

export async function criarItem(dados: DadosItemEstoque) {
  const { data } = await api.post<ItemEstoque>('/itens-estoque', dados)
  avisarEstoqueAlterado()
  return data
}

export async function atualizarItem(id: string, dados: DadosItemEstoque) {
  const { data } = await api.put<ItemEstoque>(`/itens-estoque/${encodeURIComponent(id)}`, dados)
  avisarEstoqueAlterado()
  return data
}

export async function excluirItem(id: string) {
  await api.delete(`/itens-estoque/${encodeURIComponent(id)}`)
  avisarEstoqueAlterado()
}

// Doações (entradas)
// Editar doação ou saída só muda doador/finalidade e data, então não avisa o estoque.

export async function listarDoacoes() {
  const { data } = await api.get<Doacao[]>('/doacoes')
  return data
}

export async function criarDoacao(dados: DadosDoacao) {
  const { data } = await api.post<Doacao>('/doacoes', dados)
  avisarEstoqueAlterado()
  return data
}

export async function atualizarDoacao(id: string, dados: DadosDoacao) {
  const { data } = await api.put<Doacao>(`/doacoes/${encodeURIComponent(id)}`, dados)
  return data
}

export async function excluirDoacao(id: string) {
  await api.delete(`/doacoes/${encodeURIComponent(id)}`)
  avisarEstoqueAlterado()
}

// Saídas de estoque (somente coordenação)

export async function listarSaidas() {
  const { data } = await api.get<SaidaEstoque[]>('/saidas-estoque')
  return data
}

export async function criarSaida(dados: DadosSaida) {
  const { data } = await api.post<SaidaEstoque>('/saidas-estoque', dados)
  avisarEstoqueAlterado()
  return data
}

export async function atualizarSaida(id: string, dados: DadosSaida) {
  const { data } = await api.put<SaidaEstoque>(`/saidas-estoque/${encodeURIComponent(id)}`, dados)
  return data
}

export async function excluirSaida(id: string) {
  await api.delete(`/saidas-estoque/${encodeURIComponent(id)}`)
  avisarEstoqueAlterado()
}
