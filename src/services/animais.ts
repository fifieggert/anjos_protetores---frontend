import { api } from './api'
import type { Animal, DadosAnimal } from '../types/animal'

export async function listarAnimais() {
  const { data } = await api.get<Animal[]>('/animais')
  return data
}

export async function criarAnimal(dados: DadosAnimal) {
  const { data } = await api.post<Animal>('/animais', dados)
  return data
}

export async function atualizarAnimal(id: string, dados: DadosAnimal) {
  const { data } = await api.put<Animal>(`/animais/${encodeURIComponent(id)}`, dados)
  return data
}

export async function excluirAnimal(id: string) {
  await api.delete(`/animais/${encodeURIComponent(id)}`)
}
