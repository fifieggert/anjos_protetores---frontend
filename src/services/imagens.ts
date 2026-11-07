import { api } from './api'

// Upload de foto (animal ou evento). Usa a instância autenticada (envia o token).
// O Content-Type não é definido aqui: com FormData, o navegador monta o
// multipart/form-data com o "boundary" certo. Devolve o caminho interno
// (/api/imagens/<uuid>.<ext>) para gravar em fotoUrl/imagemUrl.
export async function enviarImagem(arquivo: File) {
  const dados = new FormData()
  dados.append('arquivo', arquivo)

  const { data } = await api.post<{ url?: unknown }>('/imagens', dados)
  if (typeof data?.url !== 'string' || data.url === '') {
    throw new Error('Resposta inesperada do servidor ao enviar a imagem.')
  }
  return data.url
}
