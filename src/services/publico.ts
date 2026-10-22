import { apiPublica } from './api'
import type {
  AnimalPublico,
  DadosInteresse,
  EstatisticasPublicas,
  EventoPublico,
  FiltrosAnimaisPublicos,
  RespostaInteresse,
} from '../types/publico'

// Rotas do site público: sem login (ver apiPublica).

export async function listarAnimaisPublicos(filtros: FiltrosAnimaisPublicos = {}) {
  const { data } = await apiPublica.get<AnimalPublico[]>('/publico/animais', { params: filtros })
  return data
}

export async function listarEventosPublicos() {
  const { data } = await apiPublica.get<EventoPublico[]>('/publico/eventos')
  return data
}

export async function buscarEstatisticas() {
  const { data } = await apiPublica.get<EstatisticasPublicas>('/publico/estatisticas')
  return data
}

// "Tenho interesse": o animal fica reservado e sai da lista pública.
export async function registrarInteresse(dados: DadosInteresse) {
  const { data } = await apiPublica.post<RespostaInteresse>('/publico/interesses', dados)
  return data
}
