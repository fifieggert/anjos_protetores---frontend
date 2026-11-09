import { describe, expect, it } from 'vitest'
import { decodificarJwt, tokenExpirado } from '../../utils/jwt'
import type { JwtPayload } from '../../utils/jwt'
import { tokenFalso } from '../helpers/jwt'

const payload: JwtPayload = { id: 'abc', perfil: 'ADMIN', iat: 1000, exp: 2000 }

describe('decodificarJwt', () => {
  it('lê o payload', () => {
    expect(decodificarJwt(tokenFalso(payload))).toEqual(payload)
  })

  it('lê caracteres fora do ASCII (base64url + UTF-8)', () => {
    const comAcento = { ...payload, id: 'João ção ???>>>' }
    expect(decodificarJwt(tokenFalso(comAcento))).toEqual(comAcento)
  })

  it.each([
    ['sem partes', 'abc'],
    ['vazio', ''],
    ['payload que não é base64', 'a.@@@.c'],
    ['payload que não é JSON', `a.${btoa('oi')}.c`],
  ])('devolve null: %s', (_, token) => {
    expect(decodificarJwt(token)).toBeNull()
  })

  it.each([
    ['payload nulo', null],
    ['perfil desconhecido', { ...payload, perfil: 'SUPERUSUARIO' }],
    ['sem id', { perfil: 'ADMIN', iat: 1, exp: 2 }],
    ['exp em texto', { ...payload, exp: '2000' }],
    ['iat em texto', { ...payload, iat: '1000' }],
  ])('recusa payload fora do formato: %s', (_, invalido) => {
    expect(decodificarJwt(tokenFalso(invalido))).toBeNull()
  })
})

describe('tokenExpirado', () => {
  const agora = Math.floor(Date.now() / 1000)

  it('não está expirado antes do exp', () => {
    expect(tokenExpirado({ ...payload, exp: agora + 60 })).toBe(false)
  })

  it('está expirado depois do exp', () => {
    expect(tokenExpirado({ ...payload, exp: agora - 60 })).toBe(true)
  })
})
