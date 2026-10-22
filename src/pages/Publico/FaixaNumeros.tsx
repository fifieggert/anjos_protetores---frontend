import type { ReactNode } from 'react'
import { Card, Col, Flex, Row, Skeleton, Typography } from 'antd'
import { GiftOutlined, HomeOutlined } from '@ant-design/icons'
import { cores, comOpacidade } from '../../theme/cores'
import type { EstatisticasPublicas } from '../../types/publico'
import IconePatinha from './IconePatinha'

interface FaixaNumerosProps {
  estatisticas: EstatisticasPublicas | null
  carregando: boolean
}

interface Numero {
  rotulo: string
  valor: number
  icone: ReactNode
  cor: string
}

// Só números reais da API. Se a estatística falhar, a faixa não aparece.
function FaixaNumeros({ estatisticas, carregando }: FaixaNumerosProps) {
  if (!carregando && !estatisticas) return null

  const numeros: Numero[] = estatisticas
    ? [
        { rotulo: 'Animais adotados', valor: estatisticas.animaisAdotados, icone: <HomeOutlined />, cor: cores.teal },
        {
          rotulo: 'Animais disponíveis',
          valor: estatisticas.animaisDisponiveis,
          icone: <IconePatinha tamanho={22} />,
          cor: cores.primaria,
        },
        { rotulo: 'Doações recebidas', valor: estatisticas.doacoesRecebidas, icone: <GiftOutlined />, cor: cores.laranja },
      ]
    : []

  return (
    <div className="pub-container pub-faixa-numeros">
      <Card
        style={{ borderRadius: 28, boxShadow: '0 16px 48px rgba(23, 40, 57, 0.10)' }}
        styles={{ body: { padding: 28 } }}
      >
        {carregando ? (
          <Row gutter={[24, 24]}>
            {[0, 1, 2].map((i) => (
              <Col xs={24} sm={8} key={i}>
                <Skeleton avatar={{ shape: 'square', size: 52 }} title={{ width: 80 }} paragraph={{ rows: 1 }} active />
              </Col>
            ))}
          </Row>
        ) : (
          <Row gutter={[24, 24]} role="list" aria-label="O abrigo em números">
            {numeros.map((numero) => (
              <Col xs={24} sm={8} key={numero.rotulo} role="listitem">
                <Flex align="center" gap={16}>
                  <Flex
                    align="center"
                    justify="center"
                    aria-hidden
                    style={{
                      width: 52,
                      height: 52,
                      flexShrink: 0,
                      borderRadius: 16,
                      fontSize: 22,
                      color: numero.cor,
                      background: comOpacidade(numero.cor, 0.14),
                    }}
                  >
                    {numero.icone}
                  </Flex>
                  <div>
                    <Typography.Text
                      strong
                      style={{ display: 'block', fontSize: 30, lineHeight: 1.1, fontFamily: "'Quicksand', 'Inter', sans-serif" }}
                    >
                      {numero.valor.toLocaleString('pt-BR')}
                    </Typography.Text>
                    <Typography.Text type="secondary">{numero.rotulo}</Typography.Text>
                  </div>
                </Flex>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  )
}

export default FaixaNumeros
