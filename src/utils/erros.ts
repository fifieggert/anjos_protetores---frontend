import axios from 'axios'

export function dadosDoErro(erro: unknown) {
  if (!axios.isAxiosError(erro)) return null
  const data: unknown = erro.response?.data
  return data && typeof data === 'object' ? (data as { error?: unknown; campos?: unknown }) : null
}

// Mensagem da API ({ error }) ou a genérica informada.
export function mensagemDeErro(erro: unknown, generica: string) {
  if (axios.isAxiosError(erro) && !erro.response) {
    return 'Não foi possível conectar ao servidor. Tente novamente.'
  }
  const mensagem = dadosDoErro(erro)?.error
  return typeof mensagem === 'string' && mensagem.trim() !== '' ? mensagem : generica
}

export function statusDoErro(erro: unknown) {
  return axios.isAxiosError(erro) ? erro.response?.status : undefined
}

// 400 com "campos": devolve só os erros dos campos do formulário, no formato do form.setFields.
export function errosDosCampos<C extends string>(erro: unknown, camposDoForm: readonly C[]) {
  if (statusDoErro(erro) !== 400) return []
  const campos = dadosDoErro(erro)?.campos
  if (!campos || typeof campos !== 'object') return []

  return Object.entries(campos as Record<string, unknown>)
    .filter(([campo, msg]) => camposDoForm.includes(campo as C) && typeof msg === 'string')
    .map(([campo, msg]) => ({ name: campo as C, errors: [msg as string] }))
}
