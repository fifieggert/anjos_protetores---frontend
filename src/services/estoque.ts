import { api } from './api'
import type {
  DadosDoacao,
  DadosItemEstoque,
  DadosSaida,
  Doacao,
  ItemEstoque,
  SaidaEstoque,
} from '../types/estoque'

// Itens de estoque

export async function listarItens() {
  const { data } = await api.get<ItemEstoque[]>('/itens-estoque')
  return data
}

export async function criarItem(dados: DadosItemEstoque) {
  const { data } = await api.post<ItemEstoque>('/itens-estoque', dados)
  return data
}

export async function atualizarItem(id: string, dados: DadosItemEstoque) {
  const { data } = await api.put<ItemEstoque>(`/itens-estoque/${encodeURIComponent(id)}`, dados)
  return data
}

export async function excluirItem(id: string) {
  await api.delete(`/itens-estoque/${encodeURIComponent(id)}`)
}

// Doações (entradas)

export async function listarDoacoes() {
  const { data } = await api.get<Doacao[]>('/doacoes')
  return data
}

export async function criarDoacao(dados: DadosDoacao) {
  const { data } = await api.post<Doacao>('/doacoes', dados)
  return data
}

export async function atualizarDoacao(id: string, dados: DadosDoacao) {
  const { data } = await api.put<Doacao>(`/doacoes/${encodeURIComponent(id)}`, dados)
  return data
}

export async function excluirDoacao(id: string) {
  await api.delete(`/doacoes/${encodeURIComponent(id)}`)
}

// Saídas de estoque (somente coordenação)

export async function listarSaidas() {
  const { data } = await api.get<SaidaEstoque[]>('/saidas-estoque')
  return data
}

export async function criarSaida(dados: DadosSaida) {
  const { data } = await api.post<SaidaEstoque>('/saidas-estoque', dados)
  return data
}

export async function atualizarSaida(id: string, dados: DadosSaida) {
  const { data } = await api.put<SaidaEstoque>(`/saidas-estoque/${encodeURIComponent(id)}`, dados)
  return data
}

export async function excluirSaida(id: string) {
  await api.delete(`/saidas-estoque/${encodeURIComponent(id)}`)
}
