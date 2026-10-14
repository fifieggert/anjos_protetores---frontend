import { Button, Layout, Menu, Space, Typography, theme } from 'antd'
import type { MenuProps } from 'antd'
import {
  BarChartOutlined,
  DashboardOutlined,
  GlobalOutlined,
  HeartOutlined,
  HomeOutlined,
  InboxOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const { Header, Sider, Content } = Layout

const menuItems: MenuProps['items'] = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/animais', icon: <HeartOutlined />, label: 'Animais' },
  { key: '/doacoes', icon: <InboxOutlined />, label: 'Doações & Estoque' },
  { key: '/adocoes', icon: <HomeOutlined />, label: 'Adoções' },
  { key: '/relatorios', icon: <BarChartOutlined />, label: 'Relatórios' },
  { key: '/publico', icon: <GlobalOutlined />, label: 'Área Pública' },
]

function AppLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { token } = theme.useToken()

  const selectedKey = menuItems
    ?.map((item) => String(item?.key))
    .find((key) => pathname.startsWith(key))

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth={0}>
        <div
          style={{
            color: '#fff',
            fontWeight: 600,
            fontSize: 18,
            padding: '16px 24px',
            whiteSpace: 'nowrap',
          }}
        >
          Anjos Protetores
        </div>
        <Menu
          theme="dark"
          mode="inline"
          items={menuItems}
          selectedKeys={selectedKey ? [selectedKey] : []}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingInline: 24,
          }}
        >
          <Space size="middle">
            <Space size="small">
              <UserOutlined />
              {/* TODO: exibir o nome do usuário logado */}
              <Typography.Text>Usuário</Typography.Text>
            </Space>
            {/* TODO: implementar logout */}
            <Button icon={<LogoutOutlined />}>Sair</Button>
          </Space>
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AppLayout
