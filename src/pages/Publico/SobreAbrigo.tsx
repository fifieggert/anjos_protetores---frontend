import { Col, Flex, Row, Typography } from 'antd'
import { HeartFilled } from '@ant-design/icons'
import logo from '../../assets/logo-anjos.png'
import { cores, comOpacidade } from '../../theme/cores'

// TODO: texto provisório. Substituir pela apresentação escrita pelo abrigo, sem números
// que não possam ser comprovados (anos de atuação, percentuais, prêmios).
function SobreAbrigo() {
  return (
    <section id="sobre" tabIndex={-1} className="pub-secao" aria-labelledby="titulo-sobre">
      <div className="pub-container">
        <Row gutter={[48, 32]} align="middle">
          <Col xs={24} md={10}>
            <Flex
              align="center"
              justify="center"
              style={{
                aspectRatio: '1 / 1',
                maxWidth: 360,
                margin: '0 auto',
                borderRadius: 32,
                background: `linear-gradient(135deg, ${comOpacidade(cores.teal, 0.16)}, ${comOpacidade(cores.primaria, 0.16)})`,
              }}
            >
              <img src={logo} alt="Logotipo do Anjos Protetores" style={{ width: '60%', height: 'auto' }} />
            </Flex>
          </Col>
          <Col xs={24} md={14}>
            <span className="pub-selo">
              <HeartFilled style={{ color: cores.laranja }} aria-hidden />
              Sobre o abrigo
            </span>
            <Typography.Title level={2} id="titulo-sobre" style={{ marginTop: 16 }}>
              Cuidado de verdade, do resgate ao novo lar
            </Typography.Title>
            <Typography.Paragraph style={{ fontSize: 16 }}>
              O Anjos Protetores é um abrigo que resgata, cuida e busca lares para cães e gatos. Cada animal recebe
              atenção, alimentação e os cuidados de saúde de que precisa enquanto espera por uma família.
            </Typography.Paragraph>
            <Typography.Paragraph style={{ fontSize: 16, marginBottom: 0 }}>
              Acreditamos na adoção responsável: conversamos com cada interessado e toda adoção é formalizada com um
              termo assinado, para garantir o bem-estar do animal e a tranquilidade de quem adota.
            </Typography.Paragraph>
          </Col>
        </Row>
      </div>
    </section>
  )
}

export default SobreAbrigo
