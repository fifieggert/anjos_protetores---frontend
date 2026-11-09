import axios from 'axios'
import { dadosDoErro, statusDoErro } from '../../utils/erros'

// Mesmas regras do backend (POST /api/imagens), conferidas ANTES de enviar: assim um arquivo
// errado nem sai do navegador. O backend confere de novo pelo conteúdo do arquivo.
export const TAMANHO_MAXIMO = 10 * 1024 * 1024 // 10 MB
export const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'] as const
const EXTENSOES_ACEITAS = /\.(jpe?g|png|webp)$/i

export const MENSAGEM_TIPO = 'Formato não aceito. Escolha uma foto JPG, PNG ou WebP.'
export const MENSAGEM_TAMANHO = 'A foto deve ter no máximo 10 MB.'

// null = pode enviar; texto = motivo da recusa.
export function validarArquivoImagem(arquivo: File): string | null {
  // Alguns sistemas não informam o tipo (type vazio): aí vale a extensão do nome.
  const tipoOk = arquivo.type
    ? (TIPOS_ACEITOS as readonly string[]).includes(arquivo.type)
    : EXTENSOES_ACEITAS.test(arquivo.name)
  if (!tipoOk) return MENSAGEM_TIPO
  if (arquivo.size > TAMANHO_MAXIMO) return MENSAGEM_TAMANHO
  if (arquivo.size === 0) return 'O arquivo está vazio. Escolha outra foto.'
  return null
}

// Envio cancelado por nós (AbortController): não é erro e não gera mensagem para o usuário.
// Pelo tipo/código do axios, nunca pelo texto da mensagem.
export function ehEnvioCancelado(erro: unknown): boolean {
  return axios.isCancel(erro) || (axios.isAxiosError(erro) && erro.code === 'ERR_CANCELED')
}

// Mensagem do servidor ({ error }), se houver.
function mensagemDoServidor(erro: unknown) {
  const mensagem = dadosDoErro(erro)?.error
  return typeof mensagem === 'string' && mensagem.trim() !== '' ? mensagem : null
}

// Erro do envio em linguagem do usuário.
export function mensagemErroUpload(erro: unknown): string {
  if (axios.isAxiosError(erro) && !erro.response) {
    return 'Não foi possível conectar ao servidor. Verifique sua internet e tente de novo.'
  }

  switch (statusDoErro(erro)) {
    case 401:
      return 'Sua sessão expirou. Entre novamente para enviar a foto.'
    case 403:
      return 'Sua conta não tem permissão para enviar fotos. Entre novamente ou fale com a coordenação.'
    case 413:
      // o servidor diferencia arquivo grande de imagem com dimensões enormes; o proxy pode
      // responder 413 sem corpo
      return mensagemDoServidor(erro) ?? 'A foto é grande demais. Escolha um arquivo de até 10 MB.'
    case 415:
      return mensagemDoServidor(erro) ?? 'Não foi possível usar este arquivo. Escolha uma foto JPG, PNG ou WebP.'
    case 429:
      return 'Muitos envios em pouco tempo. Aguarde alguns minutos e tente de novo.'
    case 503:
      return 'O envio de fotos está indisponível no momento. Tente mais tarde.'
    default:
      return mensagemDoServidor(erro) ?? 'Não foi possível enviar a foto. Tente novamente.'
  }
}
