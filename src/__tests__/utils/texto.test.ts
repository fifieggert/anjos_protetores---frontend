import { describe, expect, it } from 'vitest'
import {
  celularValido,
  digitosDoCelular,
  formatarCpf,
  formatarIdade,
  formatarTelefone,
  mascaraCelular,
  mascaraCpf,
  normalizar,
  rotulo,
  somenteDigitos,
  urlValida,
} from '../../utils/texto'

describe('rotulo', () => {
  const rotulos = { ADMIN: 'Coordenadora' } as Record<string, string>

  it('traduz o valor conhecido', () => {
    expect(rotulo(rotulos, 'ADMIN')).toBe('Coordenadora')
  })

  it('mostra o próprio valor quando a API manda um valor novo', () => {
    expect(rotulo(rotulos, 'NOVO_PERFIL')).toBe('NOVO_PERFIL')
  })

  it.each([null, undefined, ''])('mostra "-" sem valor (%s)', (valor) => {
    expect(rotulo(rotulos, valor)).toBe('-')
  })
})

describe('normalizar', () => {
  it('ignora acentos e maiúsculas na busca', () => {
    expect(normalizar('Ração Óleo ÇÃ')).toBe('racao oleo ca')
  })
})

describe('urlValida', () => {
  it.each(['http://a.com/foto.jpg', 'https://a.com'])('aceita %s', (url) => {
    expect(urlValida(url)).toBe(true)
  })

  it.each(['javascript:alert(1)', 'ftp://a.com', 'data:text/html,oi', 'foto.jpg', ''])('recusa %s', (url) => {
    expect(urlValida(url)).toBe(false)
  })
})

describe('formatarTelefone', () => {
  it.each([
    ['47999998888', '(47) 99999-8888'],
    ['4733334444', '(47) 3333-4444'],
  ])('formata %s', (digitos, esperado) => {
    expect(formatarTelefone(digitos)).toBe(esperado)
  })

  it('mostra como veio quando o formato é outro', () => {
    expect(formatarTelefone('123')).toBe('123')
  })
})

describe('formatarIdade', () => {
  it.each([
    [0, '0 anos'],
    [1, '1 ano'],
    [3, '3 anos'],
  ])('%i -> %s', (idade, esperado) => {
    expect(formatarIdade(idade)).toBe(esperado)
  })

  it.each([null, undefined])('devolve null sem idade (%s)', (idade) => {
    expect(formatarIdade(idade)).toBeNull()
  })
})

describe('digitosDoCelular', () => {
  it('tira a máscara', () => {
    expect(digitosDoCelular('(47) 99999-8888')).toBe('47999998888')
  })

  it('tira o +55 de um número colado', () => {
    expect(digitosDoCelular('+55 47 99999-8888')).toBe('47999998888')
  })

  it('não confunde o DDD 55 com o código do país', () => {
    expect(digitosDoCelular('55999998888')).toBe('55999998888')
  })

  it('corta no máximo de 11 dígitos', () => {
    expect(digitosDoCelular('479999988887777')).toBe('47999998888')
  })
})

describe('mascaraCelular', () => {
  it.each([
    ['', ''],
    ['abc', ''],
    ['4', '(4'],
    ['47', '(47'],
    ['479', '(47) 9'],
    ['4799999', '(47) 99999'],
    ['47999998', '(47) 99999-8'],
    ['47999998888', '(47) 99999-8888'],
  ])('%s -> %s', (texto, esperado) => {
    expect(mascaraCelular(texto)).toBe(esperado)
  })
})

describe('celularValido', () => {
  it('aceita 11 dígitos, DDD em uso e nono dígito', () => {
    expect(celularValido('47999998888')).toBe(true)
  })

  it.each([
    ['fixo, sem o nono dígito', '47399998888'],
    ['DDD que não existe', '20999998888'],
    ['curto demais', '4799999888'],
    ['longo demais', '479999988880'],
    ['com máscara', '(47) 99999-8888'],
  ])('recusa %s', (_, digitos) => {
    expect(celularValido(digitos)).toBe(false)
  })
})

describe('formatarCpf', () => {
  it('formata 11 dígitos', () => {
    expect(formatarCpf('12345678901')).toBe('123.456.789-01')
  })

  it('mostra como veio quando o formato é outro', () => {
    expect(formatarCpf('123')).toBe('123')
  })
})

describe('mascaraCpf', () => {
  it.each([
    ['123', '123'],
    ['1234', '123.4'],
    ['123456', '123.456'],
    ['1234567', '123.456.7'],
    ['123456789', '123.456.789'],
    ['1234567890', '123.456.789-0'],
    ['12345678901', '123.456.789-01'],
    ['123456789012345', '123.456.789-01'],
    ['123.456.789-01', '123.456.789-01'],
  ])('%s -> %s', (texto, esperado) => {
    expect(mascaraCpf(texto)).toBe(esperado)
  })
})

describe('somenteDigitos', () => {
  it('remove tudo que não é dígito', () => {
    expect(somenteDigitos('(47) 9a9-1')).toBe('47991')
  })
})
