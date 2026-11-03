import type { ReactNode } from 'react'
import { Card, Flex, Typography } from 'antd'
import { comOpacidade } from '../theme/cores'

interface IndicadorProps {
  titulo: string
  valor: number
  icone: ReactNode
  cor: string
}

// Cartão de número no topo das telas (ex.: Doações, Adoções).
function Indicador({ titulo, valor, icone, cor }: IndicadorProps) {
  return (
    <Card style={{ height: '100%' }} styles={{ body: { padding: 20 } }}>
      <Flex align="center" gap={16}>
        <Flex
          align="center"
          justify="center"
          style={{
            width: 48,
            height: 48,
            flexShrink: 0,
            borderRadius: 14,
            fontSize: 22,
            color: cor,
            background: comOpacidade(cor, 0.12),
          }}
        >
          {icone}
        </Flex>
        <div style={{ minWidth: 0 }}>
          <Typography.Text type="secondary" style={{ display: 'block', fontSize: 13 }}>
            {titulo}
          </Typography.Text>
          <Typography.Text strong style={{ fontSize: 26, lineHeight: 1.2 }}>
            {valor.toLocaleString('pt-BR')}
          </Typography.Text>
        </div>
      </Flex>
    </Card>
  )
}

export default Indicador
