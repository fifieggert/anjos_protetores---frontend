import type { FormRule } from 'antd'
import { LIMITES_USUARIO } from '../types/usuario'

// Mesma regra de senha do backend (senhaSchema): mínimo de 8 caracteres e no máximo
// 72 bytes. Sem trim: espaços fazem parte da senha.
export const DICA_SENHA = `Mínimo de ${LIMITES_USUARIO.senhaMin} caracteres. Acentos e emojis contam mais de um.`

export function problemaNaSenha(senha: string) {
  if (senha.length < LIMITES_USUARIO.senhaMin) return `A senha deve ter no mínimo ${LIMITES_USUARIO.senhaMin} caracteres.`
  if (new TextEncoder().encode(senha).length > LIMITES_USUARIO.senhaMaxBytes) {
    return 'A senha é longa demais (acentos e emojis ocupam mais espaço).'
  }
  return null
}

// Regras do campo de senha nova (obrigatória).
export function regrasSenha(mensagemVazia = 'Informe a senha.'): FormRule[] {
  return [
    { required: true, message: mensagemVazia },
    {
      validator: (_, valor?: string) => {
        const problema = valor ? problemaNaSenha(valor) : null
        return problema ? Promise.reject(new Error(problema)) : Promise.resolve()
      },
    },
  ]
}

// Regras do campo "confirmar": igual ao campo informado.
export function regrasConfirmacao(campo: string): FormRule[] {
  return [
    { required: true, message: 'Confirme a senha.' },
    ({ getFieldValue }) => ({
      validator: (_, valor?: string) =>
        !valor || valor === getFieldValue(campo)
          ? Promise.resolve()
          : Promise.reject(new Error('As senhas não conferem.')),
    }),
  ]
}
