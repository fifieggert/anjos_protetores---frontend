// Paleta do protótipo (Lovable). Use estas constantes nas telas em vez de valores soltos.
export const cores = {
  primaria: '#00b4f0',
  teal: '#1dc5ae',
  laranja: '#fa7c20',
  sucesso: '#12c281',
  aviso: '#f2a618',
  erro: '#ee343b',

  fundo: '#f7fbfd',
  card: '#ffffff',
  texto: '#172839',
  textoSecundario: '#657383',
  borda: '#dfe6eb',
  fundoSuave: '#eff2f5',
} as const

export const fontes = {
  corpo: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  titulo: "'Quicksand', 'Inter', system-ui, sans-serif",
} as const

// Converte uma cor hex (#rrggbb) em rgba com a opacidade informada (0 a 1).
export function comOpacidade(hex: string, opacidade: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacidade})`
}
