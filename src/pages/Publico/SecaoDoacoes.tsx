import { Button, Col, Flex, Row, Typography } from 'antd'
import { DollarOutlined, ExperimentOutlined, GiftOutlined, ShoppingOutlined, WhatsAppOutlined } from '@ant-design/icons'
import { cores } from '../../theme/cores'
import { linkWhatsApp, MENSAGEM_DOACAO } from './dadosAbrigo'

const FORMAS_DE_AJUDAR = [
  { texto: 'Ração para cães e gatos', icone: <ShoppingOutlined /> },
  { texto: 'Medicamentos', icone: <ExperimentOutlined /> },
  { texto: 'Itens de limpeza e higiene', icone: <GiftOutlined /> },
  { texto: 'Valores em dinheiro', icone: <DollarOutlined /> },
]

function SecaoDoacoes() {
  const whatsapp = linkWhatsApp(MENSAGEM_DOACAO)

  return (
    <section id="doacoes" tabIndex={-1} className="pub-secao pub-secao--alternada" aria-labelledby="titulo-doacoes">
      <div className="pub-container">
        <div className="pub-doacoes">
          <Row gutter={[48, 32]} align="middle">
            <Col xs={24} lg={13}>
              <Typography.Title level={2} id="titulo-doacoes" style={{ marginTop: 0 }}>
                Quero doar
              </Typography.Title>
              <Typography.Paragraph style={{ fontSize: 16 }}>
                Toda ajuda faz diferença na rotina do abrigo. Você pode contribuir com ração, medicamentos, itens de
                limpeza ou valores. A combinação de como e quando entregar é feita pelo WhatsApp.
              </Typography.Paragraph>

              {whatsapp ? (
                <Button
                  type="primary"
                  size="large"
                  icon={<WhatsAppOutlined />}
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ marginTop: 8 }}
                >
                  Falar com o abrigo no WhatsApp
                </Button>
              ) : (
                <Typography.Text strong>Em breve, nossos canais de contato.</Typography.Text>
              )}
            </Col>

            <Col xs={24} lg={11}>
              <Flex vertical gap={12} role="list" aria-label="Formas de ajudar">
                {FORMAS_DE_AJUDAR.map((forma) => (
                  <Flex
                    key={forma.texto}
                    role="listitem"
                    align="center"
                    gap={14}
                    style={{ padding: '14px 18px', borderRadius: 16, background: cores.card }}
                  >
                    <span aria-hidden style={{ fontSize: 20, color: cores.laranja }}>
                      {forma.icone}
                    </span>
                    <Typography.Text strong>{forma.texto}</Typography.Text>
                  </Flex>
                ))}
              </Flex>
            </Col>
          </Row>
        </div>
      </div>
    </section>
  )
}

export default SecaoDoacoes
