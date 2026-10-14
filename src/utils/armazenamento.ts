// Acesso ao localStorage sempre protegido: ele pode estar bloqueado
// (modo privado, política do navegador) e lançar exceção.
const CHAVE_TOKEN = 'token'
const CHAVE_NOME = 'usuarioNome'

function ler(chave: string) {
  try {
    return localStorage.getItem(chave)
  } catch {
    return null
  }
}

function gravar(chave: string, valor: string | null) {
  try {
    if (valor === null) localStorage.removeItem(chave)
    else localStorage.setItem(chave, valor)
  } catch {
    // Sem armazenamento a sessão vale só enquanto a aba estiver aberta.
  }
}

export function lerToken() {
  return ler(CHAVE_TOKEN)
}

export function lerNome() {
  return ler(CHAVE_NOME)
}

export function salvarSessao(token: string, nome: string | null) {
  gravar(CHAVE_TOKEN, token)
  gravar(CHAVE_NOME, nome)
}

export function limparSessao() {
  gravar(CHAVE_TOKEN, null)
  gravar(CHAVE_NOME, null)
}
