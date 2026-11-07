import type { Perfil } from '../../types/auth'

function base64url(texto: string) {
  const bytes = new TextEncoder().encode(texto)
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// JWT falso com payload em base64url. O frontend não confere a assinatura.
export function tokenFalso(payload: unknown) {
  return `${base64url('{"alg":"none"}')}.${base64url(JSON.stringify(payload))}.assinatura`
}

export function tokenDoPerfil(perfil: Perfil, expiraEmSegundos = 3600) {
  const agora = Math.floor(Date.now() / 1000)
  return tokenFalso({ id: 'usuario-1', perfil, iat: agora - 60, exp: agora + expiraEmSegundos })
}
