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
