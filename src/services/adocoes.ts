import { api } from './api'
import type { SolicitacaoAdocao } from '../types/adocao'

// Interesses de adoção (somente coordenação). A lista vem inteira e é filtrada na tela.

export async function listarSolicitacoes() {
  const { data } = await api.get<SolicitacaoAdocao[]>('/solicitacoes-adocao')
  return data
}

// Só vale a partir de PENDENTE.
export async function marcarEmContato(id: string) {
  const { data } = await api.patch<SolicitacaoAdocao>(`/solicitacoes-adocao/${encodeURIComponent(id)}`, {
    status: 'EM_CONTATO',
  })
  return data
}

// Solicitação -> APROVADA e animal -> ADOTADO.
export async function concluirAdocao(id: string) {
  const { data } = await api.post<SolicitacaoAdocao>(`/solicitacoes-adocao/${encodeURIComponent(id)}/concluir`)
  return data
}

// "Não deu certo": solicitação -> RECUSADA e o animal volta a DISPONIVEL.
export async function cancelarAdocao(id: string) {
  const { data } = await api.post<SolicitacaoAdocao>(`/solicitacoes-adocao/${encodeURIComponent(id)}/cancelar`)
  return data
}

// Apaga nome e telefone. Se estava em andamento, o animal volta a DISPONIVEL.
export async function excluirSolicitacao(id: string) {
  await api.delete(`/solicitacoes-adocao/${encodeURIComponent(id)}`)
}
