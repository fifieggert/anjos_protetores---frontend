import { urlValida } from './texto'

// Caminho devolvido pelo upload do backend (POST /api/imagens): /api/imagens/<uuid>.<ext>.
// O backend sempre monta o caminho a partir do próprio prefixo "/api".
const PREFIXO_API = '/api'
export const PREFIXO_IMAGENS = `${PREFIXO_API}/imagens/`

// Endereço para usar no <img src> a partir do valor gravado em fotoUrl/imagemUrl:
// - URL http/https (cadastros antigos, link externo): como está;
// - caminho interno /api/imagens/...: resolvido contra o VITE_API_URL, que pode ser
//   - relativo ("/api", produção: site e API no mesmo domínio) -> /api/imagens/...
//   - absoluto ("http://localhost:4000/api", desenvolvimento) -> http://localhost:4000/api/imagens/...
// - qualquer outra coisa (vazio, javascript:, texto solto): undefined, para mostrar o ícone padrão.
export function urlImagem(url: string | null | undefined, baseApi: string | undefined = import.meta.env.VITE_API_URL) {
  const valor = url?.trim()
  if (!valor) return undefined

  if (valor.startsWith(PREFIXO_IMAGENS)) {
    // sem base configurada, o caminho já funciona no mesmo domínio
    const base = (baseApi ?? PREFIXO_API).trim().replace(/\/+$/, '')
    return `${base}${valor.slice(PREFIXO_API.length)}`
  }

  return urlValida(valor) ? valor : undefined
}
