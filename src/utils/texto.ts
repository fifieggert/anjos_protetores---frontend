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

// Telefone brasileiro só com dígitos (com DDD) -> (47) 99999-9999 ou (47) 9999-9999.
// Outro formato é mostrado como veio.
export function formatarTelefone(digitos: string) {
  const partes = /^(\d{2})(\d{4,5})(\d{4})$/.exec(digitos)
  return partes ? `(${partes[1]}) ${partes[2]}-${partes[3]}` : digitos
}

// Só os dígitos de um texto (ex.: para buscar telefone digitado com máscara).
export function somenteDigitos(texto: string) {
  return texto.replace(/\D/g, '')
}
