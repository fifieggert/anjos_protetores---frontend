// Âncoras das seções da página pública, na ordem do menu.
export const LINKS_SECOES = [
  { id: 'inicio', rotulo: 'Início' },
  { id: 'animais', rotulo: 'Animais' },
  { id: 'eventos', rotulo: 'Eventos' },
  { id: 'como-funciona', rotulo: 'Como funciona' },
  { id: 'doacoes', rotulo: 'Doações' },
] as const

export type IdSecao = (typeof LINKS_SECOES)[number]['id']

// Rolagem suave até a seção (instantânea para quem pediu menos movimento no sistema).
// Não muda a URL: a página pública não guarda estado no endereço.
export function rolarPara(id: IdSecao) {
  const alvo = document.getElementById(id)
  if (!alvo) return
  const menosMovimento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  alvo.scrollIntoView({ behavior: menosMovimento ? 'auto' : 'smooth', block: 'start' })
  // leva o foco do teclado junto, sem pular a tela de novo
  alvo.focus({ preventScroll: true })
}
