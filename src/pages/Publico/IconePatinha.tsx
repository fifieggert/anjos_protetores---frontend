import type { CSSProperties } from 'react'

interface IconePatinhaProps {
  tamanho?: number
  style?: CSSProperties
}

// Patinha (o @ant-design/icons não tem). Decorativa: o texto ao lado dá o significado.
function IconePatinha({ tamanho = 24, style }: IconePatinhaProps) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={style}
    >
      <ellipse cx="5.5" cy="10" rx="2.2" ry="2.8" />
      <ellipse cx="9.5" cy="5.5" rx="2.2" ry="2.9" />
      <ellipse cx="14.5" cy="5.5" rx="2.2" ry="2.9" />
      <ellipse cx="18.5" cy="10" rx="2.2" ry="2.8" />
      <path d="M12 11c-3 0-6.5 4.2-6.5 7.1 0 1.8 1.4 2.9 3.1 2.9 1.4 0 2.2-.8 3.4-.8s2 .8 3.4.8c1.7 0 3.1-1.1 3.1-2.9C18.5 15.2 15 11 12 11z" />
    </svg>
  )
}

export default IconePatinha
