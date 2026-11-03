// Rótulo em português; se a API mandar um valor novo, mostra o próprio valor.
export function rotulo<T extends string>(rotulos: Record<T, string>, valor: T | null | undefined) {
  if (!valor) return '-'
  return rotulos[valor] ?? valor
}

// Minúsculas e sem acento, para a busca local.
export function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

// URL absoluta com http:// ou https:// (ex.: foto do animal, imagem do evento).
export function urlValida(valor: string) {
  try {
    const url = new URL(valor)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// Telefone brasileiro só com dígitos (com DDD) -> (47) 99999-9999 ou (47) 9999-9999.
// Outro formato é mostrado como veio.
export function formatarTelefone(digitos: string) {
  const partes = /^(\d{2})(\d{4,5})(\d{4})$/.exec(digitos)
  return partes ? `(${partes[1]}) ${partes[2]}-${partes[3]}` : digitos
}

// Idade em anos, ex.: "1 ano", "3 anos". null quando não informada.
export function formatarIdade(idade: number | null | undefined) {
  return typeof idade === 'number' ? `${idade} ${idade === 1 ? 'ano' : 'anos'}` : null
}

// DDDs em uso no Brasil (Anatel), os mesmos aceitos pelo backend.
const DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47,
  48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87,
  88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
])

// Dígitos do celular digitado, sem o +55 (quando colado com o código do país), até 11.
export function digitosDoCelular(texto: string) {
  const digitos = somenteDigitos(texto)
  return (digitos.length > 11 && digitos.startsWith('55') ? digitos.slice(2) : digitos).slice(0, 11)
}

// Máscara enquanto a pessoa digita: (47) 99999-9999.
export function mascaraCelular(texto: string) {
  const d = digitosDoCelular(texto)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

// Celular com DDD válido: 11 dígitos e o terceiro é 9 (mesma regra do backend).
export function celularValido(digitos: string) {
  return /^\d{2}9\d{8}$/.test(digitos) && DDDS.has(Number(digitos.slice(0, 2)))
}

// CPF só com dígitos -> 000.000.000-00. Outro formato é mostrado como veio.
export function formatarCpf(digitos: string) {
  const partes = /^(\d{3})(\d{3})(\d{3})(\d{2})$/.exec(digitos)
  return partes ? `${partes[1]}.${partes[2]}.${partes[3]}-${partes[4]}` : digitos
}

// Máscara enquanto a pessoa digita: 000.000.000-00 (até 11 dígitos). Os dígitos
// verificadores são conferidos pelo backend.
export function mascaraCpf(texto: string) {
  const d = somenteDigitos(texto).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

// Só os dígitos de um texto (ex.: para buscar telefone digitado com máscara).
export function somenteDigitos(texto: string) {
  return texto.replace(/\D/g, '')
}
