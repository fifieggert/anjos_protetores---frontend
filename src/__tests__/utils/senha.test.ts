import { describe, expect, it } from 'vitest'
import type { FormInstance, FormRule } from 'antd'
import { problemaNaSenha, regrasConfirmacao, regrasSenha } from '../../utils/senha'
import { LIMITES_USUARIO } from '../../types/usuario'

// Roda o validator de uma regra do antd e devolve a mensagem de erro (null = passou).
async function validar(regra: FormRule | undefined, valor: string | undefined, valores: Record<string, string> = {}) {
  const form = { getFieldValue: (campo: string) => valores[campo] } as unknown as FormInstance
  const resolvida = typeof regra === 'function' ? regra(form) : regra
  try {
    await resolvida?.validator?.({} as never, valor, () => undefined)
    return null
  } catch (e) {
    return (e as Error).message
  }
}

describe('problemaNaSenha', () => {
  it('aceita o tamanho mínimo', () => {
    expect(problemaNaSenha('a'.repeat(LIMITES_USUARIO.senhaMin))).toBeNull()
  })

  it('recusa abaixo do mínimo', () => {
    expect(problemaNaSenha('a'.repeat(LIMITES_USUARIO.senhaMin - 1))).toContain('no mínimo')
  })

  it('aceita exatamente o limite de bytes', () => {
    expect(problemaNaSenha('a'.repeat(LIMITES_USUARIO.senhaMaxBytes))).toBeNull()
  })

  it('conta bytes, não caracteres: acentos ocupam mais espaço', () => {
    expect(problemaNaSenha('é'.repeat(LIMITES_USUARIO.senhaMaxBytes))).toContain('longa demais')
  })
})

describe('regrasSenha', () => {
  it('tem mensagem de campo vazio configurável', () => {
    expect(regrasSenha('Informe a nova senha.')[0]).toMatchObject({ required: true, message: 'Informe a nova senha.' })
  })

  it('o validator recusa senha curta e aceita senha boa', async () => {
    const regra = regrasSenha()[1]
    await expect(validar(regra, 'curta')).resolves.toContain('no mínimo')
    await expect(validar(regra, 'senha-boa-123')).resolves.toBeNull()
  })

  it('deixa o campo vazio para a regra "required"', async () => {
    await expect(validar(regrasSenha()[1], undefined)).resolves.toBeNull()
  })
})

describe('regrasConfirmacao', () => {
  const regra = regrasConfirmacao('senha')[1]

  it('aceita quando confere com o outro campo', async () => {
    await expect(validar(regra, 'abc', { senha: 'abc' })).resolves.toBeNull()
  })

  it('recusa quando não confere', async () => {
    await expect(validar(regra, 'abc', { senha: 'xyz' })).resolves.toBe('As senhas não conferem.')
  })

  it('deixa o campo vazio para a regra "required"', async () => {
    await expect(validar(regra, undefined, { senha: 'xyz' })).resolves.toBeNull()
  })
})
