import { useEffect, useState } from 'react'
import { Avatar, Badge, Button, Drawer, Grid, Input, Layout, Menu, Typography } from 'antd'
import type { MenuProps } from 'antd'
import {
  BarChartOutlined,
  BellOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  GlobalOutlined,
  HeartOutlined,
  HomeOutlined,
  InboxOutlined,
  LogoutOutlined,
  MenuOutlined,
  RightOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo-anjos.png'
import { cores, comOpacidade, fontes } from '../../theme/cores'
import { useAuth } from '../../contexts/AuthContext'
import { rotulosPerfil } from '../../types/auth'
import { aoAlterarEstoque, listarAlertas } from '../../services/estoque'
import type { EstadoTelaEstoque, ItemEstoque } from '../../types/estoque'

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

// Quantos nomes de itens o card "Estoque baixo" mostra.
const ITENS_NO_CARD = 3

// Busca os itens abaixo do mínimo ao montar o layout e de novo a cada mudança no estoque.
// null = carregando ou falhou: o card fica escondido e o menu segue funcionando.
function useAlertasEstoque() {
  const [alertas, setAlertas] = useState<ItemEstoque[] | null>(null)

  useEffect(() => {
    let ativo = true
    let ultimaBusca = 0

    function buscar() {
      const busca = ++ultimaBusca
      listarAlertas()
        .then((lista) => {
          // Ignora respostas de buscas antigas que chegaram depois de uma mais nova.
          if (ativo && busca === ultimaBusca) setAlertas(Array.isArray(lista) ? lista : null)
        })
        .catch(() => {
          if (ativo && busca === ultimaBusca) setAlertas(null)
        })
    }

    buscar()
    const cancelar = aoAlterarEstoque(buscar)
    return () => {
      ativo = false
      cancelar()
    }
  }, [])

  return alertas
}

// Mais crítico = menor fração do mínimo (esgotados primeiro).
function maisCriticos(itens: ItemEstoque[]) {
  return [...itens]
    .sort((a, b) => a.quantidadeAtual / a.quantidadeMinima - b.quantidadeAtual / b.quantidadeMinima)
    .slice(0, ITENS_NO_CARD)
}

interface CardEstoqueBaixoProps {
  alertas: ItemEstoque[]
  onClick: () => void
}

function CardEstoqueBaixo({ alertas, onClick }: CardEstoqueBaixoProps) {
  const temAlertas = alertas.length > 0
  const cor = temAlertas ? cores.laranja : cores.sucesso
  const criticos = maisCriticos(alertas)
  const restantes = alertas.length - criticos.length

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={temAlertas ? 'Ver itens com estoque baixo' : 'Ver estoque'}
      onClick={onClick}
      onKeyDown={(evento) => {
        if (evento.key === 'Enter' || evento.key === ' ') {
          evento.preventDefault()
          onClick()
        }
      }}
      style={{
        marginTop: 16,
        padding: 16,
        borderRadius: 16,
        cursor: 'pointer',
        background: comOpacidade(cor, 0.1),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {temAlertas ? <WarningOutlined style={{ color: cor }} /> : <CheckCircleOutlined style={{ color: cor }} />}
        <Typography.Text
          style={{
            flex: 1,
            color: cor,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          {temAlertas ? 'Estoque baixo' : 'Estoque em dia'}
        </Typography.Text>
        <RightOutlined style={{ color: cor, fontSize: 10 }} />
      </div>

      {temAlertas ? (
        <>
          <Typography.Text strong style={{ display: 'block', marginTop: 4, fontSize: 13 }}>
            {alertas.length === 1 ? '1 item abaixo do mínimo' : `${alertas.length} itens abaixo do mínimo`}
          </Typography.Text>
          <ul style={{ margin: '4px 0 0', paddingInlineStart: 18, fontSize: 13, color: cores.textoSecundario }}>
            {criticos.map((item) => (
              <li key={item.id} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.nomeItem} ({item.quantidadeAtual === 0 ? 'esgotado' : `${item.quantidadeAtual}/${item.quantidadeMinima}`})
              </li>
            ))}
          </ul>
          {restantes > 0 && (
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 2, fontSize: 12 }}>
              e mais {restantes}
            </Typography.Text>
          )}
        </>
      ) : (
        <Typography.Text style={{ display: 'block', marginTop: 4, fontSize: 13 }}>
          Nenhum item abaixo do mínimo.
        </Typography.Text>
      )}
    </div>
  )
}

interface SidebarProps {
  alertas: ItemEstoque[] | null
  onNavegar?: () => void
}

function Sidebar({ alertas, onNavegar }: SidebarProps) {
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

      {alertas && (
        <CardEstoqueBaixo
          alertas={alertas}
          onClick={() => {
            const estado: EstadoTelaEstoque = { verEstoqueBaixo: alertas.length > 0 }
            navigate('/doacoes', { state: estado })
            onNavegar?.()
          }}
        />
      )}

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
  // Buscado aqui (e não no Sidebar) porque no celular o Drawer só monta o menu quando abre.
  const alertasEstoque = useAlertasEstoque()

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
          <Sidebar alertas={alertasEstoque} />
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
          <Sidebar alertas={alertasEstoque} onNavegar={() => setMenuAberto(false)} />
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
