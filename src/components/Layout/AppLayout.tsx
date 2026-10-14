import { useState } from 'react'
import { Avatar, Badge, Button, Drawer, Grid, Input, Layout, Menu, Typography } from 'antd'
import type { MenuProps } from 'antd'
import {
  BarChartOutlined,
  BellOutlined,
  DashboardOutlined,
  GlobalOutlined,
  HeartOutlined,
  HomeOutlined,
  InboxOutlined,
  LogoutOutlined,
  MenuOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo-anjos.png'
import { cores, comOpacidade, fontes } from '../../theme/cores'
import { useAuth } from '../../contexts/AuthContext'
import { rotulosPerfil } from '../../types/auth'

const { Header, Sider, Content } = Layout

const LARGURA_SIDEBAR = 256

const menuItems: NonNullable<MenuProps['items']> = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/animais', icon: <HeartOutlined />, label: 'Animais' },
  { key: '/doacoes', icon: <InboxOutlined />, label: 'Doações' },
  { key: '/adocoes', icon: <HomeOutlined />, label: 'Adoções' },
  { key: '/relatorios', icon: <BarChartOutlined />, label: 'Relatórios' },
  { key: '/publico', icon: <GlobalOutlined />, label: 'Área Pública' },
]

// Itens do menu visíveis só para ADMIN (as rotas também são protegidas no App.tsx).
const ROTAS_SOMENTE_ADMIN = ['/relatorios']

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/)
  const primeira = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : ''
  return (primeira + ultima).toUpperCase()
}

interface SidebarProps {
  onNavegar?: () => void
}

function Sidebar({ onNavegar }: SidebarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { usuario, logout } = useAuth()

  const itens =
    usuario?.perfil === 'ADMIN'
      ? menuItems
      : menuItems.filter((item) => !ROTAS_SOMENTE_ADMIN.includes(String(item?.key)))

  const selectedKey = itens
    .map((item) => String(item?.key))
    .find((key) => pathname.startsWith(key))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px', marginBottom: 24 }}>
        <img
          src={logo}
          alt="Anjos Protetores"
          style={{
            width: 56,
            height: 56,
            flexShrink: 0,
            borderRadius: 12,
            padding: 6,
            objectFit: 'contain',
            background: comOpacidade(cores.teal, 0.15),
          }}
        />
        <div style={{ fontFamily: fontes.titulo, fontWeight: 700, fontSize: 20, lineHeight: 1.15 }}>
          <div style={{ color: cores.texto }}>Anjos</div>
          <div style={{ color: cores.primaria }}>Protetores</div>
        </div>
      </div>

      <Menu
        mode="inline"
        items={itens}
        selectedKeys={selectedKey ? [selectedKey] : []}
        onClick={({ key }) => {
          navigate(key)
          onNavegar?.()
        }}
        style={{ flex: 1, overflowY: 'auto', borderInlineEnd: 'none', fontWeight: 500 }}
      />

      <div
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 16,
          background: comOpacidade(cores.laranja, 0.1),
        }}
      >
        <Typography.Text
          style={{
            display: 'block',
            color: cores.laranja,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          Estoque baixo
        </Typography.Text>
        {/* TODO: buscar os itens com estoque baixo na API */}
        <Typography.Text style={{ display: 'block', marginTop: 4, fontSize: 13 }}>
          Ração para filhotes está acabando.
        </Typography.Text>
      </div>

      <Button
        type="text"
        block
        icon={<LogoutOutlined />}
        onClick={() => {
          logout()
          navigate('/login', { replace: true })
        }}
        style={{
          marginTop: 8,
          height: 44,
          paddingInline: 16,
          borderRadius: 16,
          justifyContent: 'flex-start',
          color: cores.textoSecundario,
          fontWeight: 500,
        }}
      >
        Sair
      </Button>
    </div>
  )
}

function AppLayout() {
  const telas = Grid.useBreakpoint()
  const desktop = !!telas.lg
  const [menuAberto, setMenuAberto] = useState(false)
  const espacamento = telas.md ? 32 : 16
  const { usuario } = useAuth()

  // O nome vem da resposta do login; "Usuário" quando o backend não o envia.
  const nome = usuario?.nome ?? 'Usuário'
  const perfil = usuario ? rotulosPerfil[usuario.perfil] : ''

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {desktop ? (
        <Sider
          width={LARGURA_SIDEBAR}
          theme="light"
          style={{
            position: 'fixed',
            insetBlock: 0,
            insetInlineStart: 0,
            height: '100vh',
            overflow: 'auto',
            borderInlineEnd: `1px solid ${cores.borda}`,
          }}
        >
          <Sidebar />
        </Sider>
      ) : (
        <Drawer
          placement="left"
          size={LARGURA_SIDEBAR}
          open={menuAberto}
          onClose={() => setMenuAberto(false)}
          closable={false}
          styles={{ body: { padding: 0 } }}
        >
          <Sidebar onNavegar={() => setMenuAberto(false)} />
        </Drawer>
      )}

      <Layout style={{ marginInlineStart: desktop ? LARGURA_SIDEBAR : 0 }}>
        <Header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            paddingInline: espacamento,
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${cores.borda}`,
          }}
        >
          {!desktop && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              aria-label="Abrir menu"
              onClick={() => setMenuAberto(true)}
            />
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            {telas.md && (
              <Input
                variant="borderless"
                prefix={<SearchOutlined style={{ color: cores.textoSecundario }} />}
                placeholder="Buscar animal, doador ou protocolo..."
                style={{
                  maxWidth: 448,
                  height: 40,
                  paddingInline: 16,
                  borderRadius: 999,
                  background: cores.fundoSuave,
                }}
              />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge dot color={cores.laranja} offset={[-8, 8]}>
              <Button
                type="text"
                shape="circle"
                icon={<BellOutlined style={{ fontSize: 18 }} />}
                aria-label="Notificações"
              />
            </Badge>

            {telas.sm && (
              <div style={{ textAlign: 'right', lineHeight: 1.25 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: cores.texto }}>{nome}</div>
                <div style={{ fontSize: 12, color: cores.textoSecundario }}>{perfil}</div>
              </div>
            )}

            <Avatar
              size={40}
              style={{
                flexShrink: 0,
                fontWeight: 700,
                color: cores.teal,
                background: comOpacidade(cores.teal, 0.2),
              }}
            >
              {iniciais(nome)}
            </Avatar>
          </div>
        </Header>

        <Content style={{ padding: espacamento, background: cores.fundo }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AppLayout
