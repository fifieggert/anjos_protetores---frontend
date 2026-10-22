import { useEffect, useState } from 'react'
import { Button, Drawer, Grid } from 'antd'
import { CloseOutlined, LoginOutlined, MenuOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo-anjos.png'
import { useAuth } from '../../contexts/AuthContext'
import { LINKS_SECOES, rolarPara } from './rolagem'
import type { IdSecao } from './rolagem'

// A partir desta rolagem a barra ganha fundo translúcido.
const ROLAGEM_PARA_FUNDO = 8

function NavbarPublica() {
  const telas = Grid.useBreakpoint()
  const desktop = !!telas.lg
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [rolada, setRolada] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)

  useEffect(() => {
    const atualizar = () => setRolada(window.scrollY > ROLAGEM_PARA_FUNDO)
    atualizar()
    window.addEventListener('scroll', atualizar, { passive: true })
    return () => window.removeEventListener('scroll', atualizar)
  }, [])

  function irPara(evento: React.MouseEvent<HTMLAnchorElement>, id: IdSecao) {
    evento.preventDefault()
    setMenuAberto(false)
    rolarPara(id)
  }

  const links = (
    <ul className="pub-links" style={desktop ? undefined : { flexDirection: 'column', alignItems: 'stretch' }}>
      {LINKS_SECOES.map((link) => (
        <li key={link.id}>
          <a className="pub-link" href={`#${link.id}`} onClick={(e) => irPara(e, link.id)}>
            {link.rotulo}
          </a>
        </li>
      ))}
    </ul>
  )

  const botaoEntrar = (
    <Button
      type="primary"
      icon={<LoginOutlined />}
      onClick={() => navigate(usuario ? '/dashboard' : '/login')}
      block={!desktop}
      size={desktop ? 'middle' : 'large'}
    >
      {usuario ? 'Ir para o painel' : 'Entrar'}
    </Button>
  )

  return (
    <header className={`pub-navbar${rolada || menuAberto ? ' pub-navbar--rolada' : ''}`}>
      <nav className="pub-container pub-navbar-conteudo" aria-label="Navegação principal">
        <a className="pub-marca" href="#inicio" onClick={(e) => irPara(e, 'inicio')}>
          <img src={logo} alt="" />
          <span>Anjos Protetores</span>
        </a>

        {desktop ? (
          <>
            {links}
            {botaoEntrar}
          </>
        ) : (
          <Button
            type="text"
            size="large"
            icon={<MenuOutlined />}
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
            onClick={() => setMenuAberto(true)}
          />
        )}
      </nav>

      {!desktop && (
        <Drawer
          className="pub-drawer"
          placement="right"
          size={280}
          open={menuAberto}
          onClose={() => setMenuAberto(false)}
          title="Menu"
          closeIcon={<CloseOutlined aria-label="Fechar menu" />}
        >
          <nav aria-label="Navegação principal">{links}</nav>
          <div style={{ marginTop: 24 }}>{botaoEntrar}</div>
        </Drawer>
      )}
    </header>
  )
}

export default NavbarPublica
