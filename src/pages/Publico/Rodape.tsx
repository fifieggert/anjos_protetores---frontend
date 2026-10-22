import type { ReactNode } from 'react'
import { Col, Row } from 'antd'
import {
  EnvironmentOutlined,
  FacebookOutlined,
  InstagramOutlined,
  LockOutlined,
  MailOutlined,
  WhatsAppOutlined,
} from '@ant-design/icons'
import { Link } from 'react-router-dom'
import logo from '../../assets/logo-anjos.png'
import { dadosAbrigo, linkWhatsApp, whatsappFormatado } from './dadosAbrigo'
import { LINKS_SECOES, rolarPara } from './rolagem'

interface ItemContato {
  chave: string
  icone: ReactNode
  conteudo: ReactNode
}

// Só os contatos preenchidos em dadosAbrigo.ts aparecem.
function itensDeContato(): ItemContato[] {
  const itens: ItemContato[] = []
  const whatsapp = linkWhatsApp()
  if (whatsapp) {
    itens.push({
      chave: 'whatsapp',
      icone: <WhatsAppOutlined />,
      conteudo: (
        <a href={whatsapp} target="_blank" rel="noopener noreferrer">
          {whatsappFormatado()}
        </a>
      ),
    })
  }
  if (dadosAbrigo.email) {
    itens.push({
      chave: 'email',
      icone: <MailOutlined />,
      conteudo: <a href={`mailto:${dadosAbrigo.email}`}>{dadosAbrigo.email}</a>,
    })
  }
  if (dadosAbrigo.endereco) {
    itens.push({ chave: 'endereco', icone: <EnvironmentOutlined />, conteudo: dadosAbrigo.endereco })
  }
  if (dadosAbrigo.instagram) {
    itens.push({
      chave: 'instagram',
      icone: <InstagramOutlined />,
      conteudo: (
        <a href={dadosAbrigo.instagram} target="_blank" rel="noopener noreferrer">
          Instagram
        </a>
      ),
    })
  }
  if (dadosAbrigo.facebook) {
    itens.push({
      chave: 'facebook',
      icone: <FacebookOutlined />,
      conteudo: (
        <a href={dadosAbrigo.facebook} target="_blank" rel="noopener noreferrer">
          Facebook
        </a>
      ),
    })
  }
  return itens
}

function Rodape() {
  const contatos = itensDeContato()
  const ano = new Date().getFullYear()

  return (
    <footer className="pub-rodape">
      <div className="pub-container">
        <Row gutter={[32, 32]}>
          <Col xs={24} md={8}>
            <div className="pub-marca" style={{ color: '#ffffff' }}>
              <img src={logo} alt="" />
              <span>{dadosAbrigo.nome}</span>
            </div>
            <p style={{ margin: '12px 0 0' }}>Cada vida importa.</p>
          </Col>

          <Col xs={12} md={5}>
            <nav aria-label="Navegação do rodapé">
              <h2 className="pub-rodape-titulo">Navegação</h2>
              <ul className="pub-rodape-lista">
                {LINKS_SECOES.map((link) => (
                  <li key={link.id}>
                    <a
                      href={`#${link.id}`}
                      onClick={(evento) => {
                        evento.preventDefault()
                        rolarPara(link.id)
                      }}
                    >
                      {link.rotulo}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </Col>

          <Col xs={12} md={6}>
            <h2 className="pub-rodape-titulo">Contato</h2>
            {contatos.length > 0 ? (
              <ul className="pub-rodape-lista">
                {contatos.map((item) => (
                  <li key={item.chave}>
                    <span aria-hidden style={{ marginRight: 8 }}>
                      {item.icone}
                    </span>
                    {item.conteudo}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0 }}>Em breve, nossos canais de contato.</p>
            )}
          </Col>

          <Col xs={24} md={5}>
            <h2 className="pub-rodape-titulo">Equipe</h2>
            <Link to="/login">
              <LockOutlined aria-hidden style={{ marginRight: 8 }} />
              Área da equipe
            </Link>
          </Col>
        </Row>

        <div className="pub-rodape-direitos">
          © {ano} {dadosAbrigo.nome}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}

export default Rodape
