import { afterEach, describe, expect, it, vi } from 'vitest'
import { filtrarOpcaoItem, opcoesItens } from '../../pages/Doacoes/opcoesItens'
import { dadosAbrigo, linkWhatsApp, whatsappFormatado } from '../../pages/Publico/dadosAbrigo'
import { rolarPara } from '../../pages/Publico/rolagem'
import type { ItemEstoque } from '../../types/estoque'

describe('dadosAbrigo', () => {
  const original = dadosAbrigo.whatsapp

  afterEach(() => {
    dadosAbrigo.whatsapp = original
  })

  it('lê o número válido de VITE_WHATSAPP_ABRIGO', () => {
    expect(dadosAbrigo.whatsapp).toBe('5547999990000')
  })

  it('monta o link com a mensagem codificada', () => {
    expect(linkWhatsApp('Olá, mundo')).toBe('https://wa.me/5547999990000?text=Ol%C3%A1%2C%20mundo')
  })

  it('monta o link sem mensagem', () => {
    expect(linkWhatsApp()).toBe('https://wa.me/5547999990000')
  })

  it('sem número configurado, não há link', () => {
    dadosAbrigo.whatsapp = ''
    expect(linkWhatsApp('oi')).toBeNull()
  })

  it('exibe o número sem o 55', () => {
    expect(whatsappFormatado()).toBe('(47) 99999-0000')
  })
})

describe('opcoesItens', () => {
  const item = (id: string, nomeItem: string, quantidadeAtual: number) =>
    ({ id, nomeItem, quantidadeAtual, categoria: 'ALIMENTO' }) as unknown as ItemEstoque

  it('ordena em ordem alfabética sem alterar a lista original', () => {
    const itens = [item('2', 'Ração', 1), item('1', 'Água', 2)]
    expect(opcoesItens(itens).map((o) => o.nome)).toEqual(['Água', 'Ração'])
    expect(itens[0]?.id).toBe('2')
  })

  it('mostra o saldo atual no rótulo', () => {
    expect(opcoesItens([item('1', 'Ração', 7)])[0]?.label).toContain('(7 em estoque)')
  })
})

describe('filtrarOpcaoItem', () => {
  it('ignora acentos, maiúsculas e espaços nas pontas', () => {
    expect(filtrarOpcaoItem('  RACAO ', { nome: 'Ração' })).toBe(true)
  })

  it('não encontra o que não combina', () => {
    expect(filtrarOpcaoItem('areia', { nome: 'Ração' })).toBe(false)
    expect(filtrarOpcaoItem('areia')).toBe(false)
  })
})

describe('rolarPara', () => {
  function secao(id: string) {
    const elemento = document.createElement('section')
    elemento.id = id
    elemento.tabIndex = -1
    document.body.appendChild(elemento)
    return elemento
  }

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('rola suave até a seção e leva o foco junto', () => {
    const alvo = secao('animais')
    rolarPara('animais')
    expect(alvo.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    expect(alvo).toHaveFocus()
  })

  it('não anima para quem pediu menos movimento', () => {
    vi.mocked(window.matchMedia).mockReturnValueOnce({ matches: true } as MediaQueryList)
    const alvo = secao('eventos')
    rolarPara('eventos')
    expect(alvo.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' })
  })

  it('não faz nada se a seção não existir', () => {
    expect(() => rolarPara('doacoes')).not.toThrow()
  })
})
