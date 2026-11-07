import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import GraficoAdocoes from '../../pages/Dashboard/GraficoAdocoes'

const MENSAGEM_VAZIO = 'Nenhuma adoção concluída nos últimos 6 meses.'

function alturaDaBarra(nome: string) {
  const mes = screen.getByRole('listitem', { name: nome, hidden: true })
  const barra = mes.querySelector('div > div')
  if (!(barra instanceof HTMLElement)) throw new Error(`Barra de ${nome} não encontrada.`)
  return barra.style.height
}

describe('com dados', () => {
  const meses = [
    { mes: '2026-04', total: 4 },
    { mes: '2026-05', total: 1 },
    { mes: '2026-06', total: 0 },
  ]

  it('lista um item por mês, na ordem recebida', () => {
    render(<GraficoAdocoes meses={meses} />)

    const lista = screen.getByRole('list', { name: 'Adoções concluídas por mês' })
    const itens = within(lista).getAllByRole('listitem')
    expect(itens.map((item) => item.getAttribute('aria-label'))).toEqual([
      'abr/26: 4 adoções',
      'mai/26: 1 adoção',
      'jun/26: 0 adoções',
    ])
  })

  it('não mostra o aviso de vazio', () => {
    render(<GraficoAdocoes meses={meses} />)

    expect(screen.queryByText(MENSAGEM_VAZIO)).not.toBeInTheDocument()
  })

  it('calcula a altura de cada barra em proporção ao maior mês', () => {
    render(<GraficoAdocoes meses={meses} />)

    expect(alturaDaBarra('abr/26: 4 adoções')).toBe('100%')
    expect(alturaDaBarra('mai/26: 1 adoção')).toBe('25%')
  })

  it('mantém uma linha fina no mês sem adoção, para ele continuar visível', () => {
    render(<GraficoAdocoes meses={meses} />)

    expect(alturaDaBarra('jun/26: 0 adoções')).toBe('2px')
  })
})

describe('vazio', () => {
  it('avisa quando todos os meses estão zerados, sem crescer nenhuma barra', () => {
    render(
      <GraficoAdocoes
        meses={[
          { mes: '2026-05', total: 0 },
          { mes: '2026-06', total: 0 },
        ]}
      />,
    )

    expect(screen.getByText(MENSAGEM_VAZIO)).toBeInTheDocument()
    expect(alturaDaBarra('mai/26: 0 adoções')).toBe('2px')
  })

  it('avisa quando a lista de meses vem vazia', () => {
    render(<GraficoAdocoes meses={[]} />)

    expect(screen.getByText(MENSAGEM_VAZIO)).toBeInTheDocument()
  })
})
