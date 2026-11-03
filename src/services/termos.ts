import axios from 'axios'
import { api } from './api'
import type { TermoAdocao } from '../types/termo'

// Termos de adoção (somente coordenação).

// Idempotente: se já existe um termo não assinado para o mesmo animal e a mesma
// solicitação, a API devolve esse (200) em vez de criar outro (201).
export async function criarTermo(animalId: string, solicitacaoId: string) {
  const { data } = await api.post<TermoAdocao>('/termos-adocao', { animalId, solicitacaoId })
  return data
}

// O PDF exige o token, então não dá para abrir por link: vem como Blob. Ele tem nome e
// telefone do interessado: só em memória, nunca em armazenamento do navegador.
export async function baixarPdfTermo(termoId: string) {
  try {
    const { data } = await api.get<Blob>(`/termos-adocao/${encodeURIComponent(termoId)}/pdf`, {
      responseType: 'blob',
    })
    return data.type === 'application/pdf' ? data : new Blob([data], { type: 'application/pdf' })
  } catch (e) {
    await lerErroDoBlob(e)
    throw e
  }
}

// Com responseType "blob", o erro ({ error }) também vem como Blob. Converte para objeto
// para que mensagemDeErro leia o campo error como nas outras telas.
async function lerErroDoBlob(erro: unknown) {
  if (!axios.isAxiosError(erro) || !erro.response || !(erro.response.data instanceof Blob)) return
  try {
    erro.response.data = JSON.parse(await erro.response.data.text()) as unknown
  } catch {
    erro.response.data = null
  }
}
