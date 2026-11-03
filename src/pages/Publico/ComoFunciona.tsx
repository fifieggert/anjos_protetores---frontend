import type { ReactNode } from 'react'
import { Card, Col, Flex, Row, Typography } from 'antd'
import { FileDoneOutlined, FormOutlined, SearchOutlined, WhatsAppOutlined } from '@ant-design/icons'
import { cores, comOpacidade } from '../../theme/cores'

interface Passo {
  titulo: string
  texto: string
  icone: ReactNode
  cor: string
}

const PASSOS: Passo[] = [
  {
    titulo: 'Escolha um animal',
    texto: 'Veja os animais disponíveis e conheça a história de cada um.',
    icone: <SearchOutlined />,
    cor: cores.primaria,
  },
  {
    titulo: 'Diga que tem interesse',
    texto: 'Deixe seu nome e telefone no “Ver mais” do animal escolhido.',
    icone: <FormOutlined />,
    cor: cores.teal,
  },
  {
    titulo: 'Converse com nossa equipe',
    texto: 'Entramos em contato para tirar dúvidas e combinar os próximos passos.',
    icone: <WhatsAppOutlined />,
    cor: cores.laranja,
  },
  {
    titulo: 'Assine o termo e adote',
    texto: 'Com tudo certo, você assina o termo de adoção responsável e leva seu novo amigo para casa.',
    icone: <FileDoneOutlined />,
    cor: cores.sucesso,
  },
]

function ComoFunciona() {
  return (
    <section
      id="como-funciona"
      tabIndex={-1}
      className="pub-secao pub-secao--alternada"
      aria-labelledby="titulo-como-funciona"
    >
      <div className="pub-container">
        <div className="pub-cabecalho-secao">
          <Typography.Title level={2} id="titulo-como-funciona" style={{ marginTop: 0 }}>
            Como funciona a adoção
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 0 }}>
            Um processo simples e responsável, do primeiro contato até a chegada em casa.
          </Typography.Paragraph>
        </div>

        <Row gutter={[24, 24]} role="list">
          {PASSOS.map((passo, i) => (
            <Col key={passo.titulo} xs={24} sm={12} lg={6} role="listitem">
              <Card style={{ height: '100%' }} styles={{ body: { padding: 24 } }}>
                <Flex align="center" justify="space-between" style={{ marginBottom: 16 }}>
                  <Flex
                    align="center"
                    justify="center"
                    aria-hidden
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      fontSize: 22,
                      color: passo.cor,
                      background: comOpacidade(passo.cor, 0.14),
                    }}
                  >
                    {passo.icone}
                  </Flex>
                  <Typography.Text
                    aria-hidden
                    style={{ fontSize: 32, fontWeight: 700, color: cores.borda, fontFamily: "'Quicksand', sans-serif" }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </Typography.Text>
                </Flex>
                <Typography.Title level={3} style={{ fontSize: 18, margin: '0 0 8px' }}>
                  <span className="pub-somente-leitor">Passo {i + 1}: </span>
                  {passo.titulo}
                </Typography.Title>
                <Typography.Text type="secondary">{passo.texto}</Typography.Text>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </section>
  )
}

export default ComoFunciona
