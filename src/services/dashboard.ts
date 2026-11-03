import { api } from './api'
import type { Painel } from '../types/dashboard'

// Números e listas curtas do painel da coordenação (somente ADMIN).
export async function buscarPainel() {
  const { data } = await api.get<Painel>('/dashboard')
  return data
}
