import { api } from './api'
import type { DadosEvento, Evento, PeriodoEvento } from '../types/evento'

// Eventos do abrigo (somente coordenação). Sem período, vêm todos, ordenados por data e horário.

export async function listarEventos(periodo: PeriodoEvento = 'todos') {
  const { data } = await api.get<Evento[]>('/eventos', { params: { periodo } })
  return data
}

export async function criarEvento(dados: DadosEvento) {
  const { data } = await api.post<Evento>('/eventos', dados)
  return data
}

export async function atualizarEvento(id: string, dados: DadosEvento) {
  const { data } = await api.put<Evento>(`/eventos/${encodeURIComponent(id)}`, dados)
  return data
}

export async function excluirEvento(id: string) {
  await api.delete(`/eventos/${encodeURIComponent(id)}`)
}
