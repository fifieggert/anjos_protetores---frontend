import { Button, Col, Flex, Row, Typography } from 'antd'
import { HeartFilled, HeartOutlined, WhatsAppOutlined } from '@ant-design/icons'
import imagemHero from '../../assets/hero-adocao.jpg'
import { cores, comOpacidade } from '../../theme/cores'
import { linkWhatsApp, MENSAGEM_DOACAO } from './dadosAbrigo'
import IconePatinha from './IconePatinha'
import { rolarPara } from './rolagem'

interface HeroProps {
  // null enquanto carrega ou se a estatística falhou: o selo fica escondido
  animaisDisponiveis: number | null
}

function Hero({ animaisDisponiveis }: HeroProps) {
  const whatsapp = linkWhatsApp(MENSAGEM_DOACAO)

  return (
    <section id="inicio" tabIndex={-1} className="pub-hero" aria-labelledby="titulo-hero">
      <div
        className="pub-circulo"
        aria-hidden
        style={{ width: 420, height: 420, top: -120, right: -120, background: comOpacidade(cores.primaria, 0.25) }}
      />
      <div
        className="pub-circulo"
        aria-hidden
        style={{ width: 360, height: 360, bottom: -140, left: -120, background: comOpacidade(cores.teal, 0.22) }}
      />
      <div
        className="pub-circulo"
        aria-hidden
        style={{ width: 220, height: 220, top: '40%', left: '45%', background: comOpacidade(cores.laranja, 0.14) }}
      />

      <div className="pub-container pub-hero-conteudo">
        <Row gutter={[48, 48]} align="middle">
          <Col xs={24} lg={12}>
            <span className="pub-selo">
              <HeartFilled style={{ color: cores.teal }} aria-hidden />
              Adoção responsável
            </span>
            <Typography.Title level={1} id="titulo-hero" className="pub-hero-titulo">
              Encontre um novo <span className="pub-destaque">melhor amigo</span>
            </Typography.Title>
            <Typography.Paragraph style={{ fontSize: 18, color: cores.textoSecundario, maxWidth: 520 }}>
              Resgatamos, cuidamos e encontramos lares cheios de carinho para cães e gatos. Conheça quem está esperando
              por uma família.
            </Typography.Paragraph>
            <Flex wrap gap={12} style={{ marginTop: 24 }}>
              <Button type="primary" size="large" icon={<HeartOutlined />} onClick={() => rolarPara('animais')}>
                Quero adotar
              </Button>
              {whatsapp ? (
                <Button
                  size="large"
                  icon={<WhatsAppOutlined />}
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Quero doar
                </Button>
              ) : (
                <Button size="large" onClick={() => rolarPara('doacoes')}>
                  Quero doar
                </Button>
              )}
            </Flex>
          </Col>

          <Col xs={24} lg={12}>
            <div className="pub-hero-moldura">
              <div className="pub-hero-imagem">
                <img src={imagemHero} alt="Vários cachorros de raças e tamanhos diferentes reunidos, olhando para a câmera" />
              </div>
              {animaisDisponiveis !== null && animaisDisponiveis > 0 && (
                <div className="pub-selo-flutuante">
                  <Flex
                    align="center"
                    justify="center"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      color: cores.teal,
                      background: comOpacidade(cores.teal, 0.15),
                    }}
                  >
                    <IconePatinha tamanho={24} />
                  </Flex>
                  <div style={{ lineHeight: 1.2 }}>
                    <Typography.Text strong style={{ display: 'block', fontSize: 18 }}>
                      {animaisDisponiveis.toLocaleString('pt-BR')}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                      {animaisDisponiveis === 1 ? 'amigo disponível' : 'amigos disponíveis'}
                    </Typography.Text>
                  </div>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </div>
    </section>
  )
}

export default Hero
