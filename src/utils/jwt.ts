import { PERFIS } from '../types/auth'
import type { Perfil } from '../types/auth'

export interface JwtPayload {
  id: string
  perfil: Perfil
  iat: number
  exp: number
}

function ehPayloadValido(valor: unknown): valor is JwtPayload {
  if (typeof valor !== 'object' || valor === null) return false
  const p = valor as Record<string, unknown>
  return (
    typeof p.id === 'string' &&
    typeof p.perfil === 'string' &&
    (PERFIS as readonly string[]).includes(p.perfil) &&
    typeof p.iat === 'number' &&
    typeof p.exp === 'number'
  )
}

// Decodifica o payload do JWT (base64url -> JSON). Não valida a assinatura:
// isso é responsabilidade do backend. Retorna null se o token for inválido.
export function decodificarJwt(token: string): JwtPayload | null {
  try {
    const parte = token.split('.')[1]
    if (!parte) return null

    const base64 = parte.replace(/-/g, '+').replace(/_/g, '/')
    const comPadding = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const bytes = Uint8Array.from(atob(comPadding), (c) => c.charCodeAt(0))
    const payload: unknown = JSON.parse(new TextDecoder().decode(bytes))

    return ehPayloadValido(payload) ? payload : null
  } catch {
    return null
  }
}

export function tokenExpirado(payload: JwtPayload) {
  return payload.exp * 1000 <= Date.now()
}
