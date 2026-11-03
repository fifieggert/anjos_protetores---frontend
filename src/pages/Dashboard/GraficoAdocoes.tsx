import { Typography } from 'antd'
import { cores } from '../../theme/cores'
import { rotuloMes } from '../../utils/datas'
import type { AdocoesPorMes } from '../../types/dashboard'

// Altura da área das barras (o número fica acima e o mês abaixo).
const ALTURA_BARRAS = 140

function textoAdocoes(total: number) {
  return total === 1 ? '1 adoção' : `${total} adoções`
}

interface GraficoAdocoesProps {
  meses: AdocoesPorMes[]
}

// Gráfico de barras feito só com HTML e CSS (sem biblioteca). Para leitores de tela é uma
// lista: cada mês é lido como "jun/26: 4 adoções"; os desenhos ficam escondidos deles.
function GraficoAdocoes({ meses }: GraficoAdocoesProps) {
  // a barra mais alta ocupa a área toda; com tudo zerado, nenhuma barra cresce
  const maior = Math.max(1, ...meses.map((m) => m.total))
  const semAdocoes = meses.every((m) => m.total === 0)

  return (
    <div>
      <ul
        aria-label="Adoções concluídas por mês"
        style={{ display: 'flex', gap: 8, margin: 0, padding: 0, listStyle: 'none' }}
      >
        {meses.map(({ mes, total }) => {
          const rotulo = rotuloMes(mes)
          const descricao = `${rotulo}: ${textoAdocoes(total)}`
          return (
            <li
              key={mes}
              aria-label={descricao}
              title={descricao}
              style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            >
              <span aria-hidden style={{ fontWeight: 600, fontSize: 13, color: cores.texto }}>
                {total}
              </span>
              <div
                aria-hidden
                style={{ height: ALTURA_BARRAS, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: 44,
                    // mês sem adoção fica com uma linha fina, para o mês continuar visível
                    height: total > 0 ? `${(total / maior) * 100}%` : 2,
                    minHeight: total > 0 ? 6 : undefined,
                    borderRadius: '8px 8px 2px 2px',
                    background: total > 0 ? cores.teal : cores.borda,
                    transition: 'height 0.3s',
                  }}
                />
              </div>
              <span aria-hidden style={{ fontSize: 12, color: cores.textoSecundario, whiteSpace: 'nowrap' }}>
                {rotulo}
              </span>
            </li>
          )
        })}
      </ul>
      {semAdocoes && (
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 12, textAlign: 'center' }}>
          Nenhuma adoção concluída nos últimos 6 meses.
        </Typography.Text>
      )}
    </div>
  )
}

export default GraficoAdocoes
