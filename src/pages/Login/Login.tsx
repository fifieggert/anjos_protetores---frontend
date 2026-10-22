import { useState } from 'react'
import { Alert, Button, Card, Form, Grid, Input, Typography } from 'antd'
import { LockOutlined, MailOutlined } from '@ant-design/icons'
import axios from 'axios'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import logo from '../../assets/logo-anjos.png'
import { cores, comOpacidade, fontes } from '../../theme/cores'

interface CamposLogin {
  email: string
  senha: string
}

function mensagemDeErro(erro: unknown) {
  if (axios.isAxiosError(erro)) {
    if (erro.response?.status === 401) return 'E-mail ou senha incorretos.'
    if (!erro.response) return 'Não foi possível conectar ao servidor. Tente novamente.'
  }
  return 'Erro ao entrar. Tente novamente.'
}

// Rota de origem guardada pelo ProtectedRoute; só aceita caminhos internos.
function rotaDeOrigem(state: unknown) {
  const from = (state as { from?: unknown } | null)?.from
  if (typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/login')) {
    return from
  }
  return '/dashboard'
}

function Login() {
  const { usuario, carregando, login } = useAuth()
  const location = useLocation()
  const telas = Grid.useBreakpoint()
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Já logado (ou acabou de logar): segue para a rota de origem ou /dashboard.
  if (!carregando && usuario) {
    return <Navigate to={rotaDeOrigem(location.state)} replace />
  }

  async function entrar({ email, senha }: CamposLogin) {
    setErro(null)
    setEnviando(true)
    try {
      await login(email.trim(), senha)
    } catch (e) {
      setErro(mensagemDeErro(e))
      setEnviando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: cores.fundo }}>
      {telas.lg && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: 64,
            background: `linear-gradient(135deg, ${comOpacidade(cores.primaria, 0.14)} 0%, ${comOpacidade(cores.teal, 0.14)} 50%, ${comOpacidade(cores.laranja, 0.12)} 100%)`,
          }}
        >
          <div style={{ maxWidth: 480 }}>
            <img
              src={logo}
              alt="Anjos Protetores"
              style={{ width: 120, height: 120, objectFit: 'contain', marginBottom: 32 }}
            />
            <Typography.Title style={{ fontSize: 44, lineHeight: 1.15, marginBottom: 16 }}>
              Cuidar é um ato de amor.
            </Typography.Title>
            <Typography.Paragraph style={{ fontSize: 16, color: cores.textoSecundario, marginBottom: 0 }}>
              Gerencie animais, doações e adoções da Anjos Protetores em um só lugar.
            </Typography.Paragraph>
          </div>
        </div>
      )}

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: telas.md ? 32 : 16,
        }}
      >
        <div style={{ width: '100%', maxWidth: 420 }}>
          {!telas.lg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <img
                src={logo}
                alt=""
                style={{
                  width: 48,
                  height: 48,
                  padding: 4,
                  borderRadius: 12,
                  objectFit: 'contain',
                  background: comOpacidade(cores.teal, 0.15),
                }}
              />
              <div style={{ fontFamily: fontes.titulo, fontWeight: 700, fontSize: 18, lineHeight: 1.15 }}>
                <div style={{ color: cores.texto }}>Anjos</div>
                <div style={{ color: cores.primaria }}>Protetores</div>
              </div>
            </div>
          )}

          <Card styles={{ body: { padding: telas.md ? 32 : 24 } }}>
            <Typography.Title level={3} style={{ marginBottom: 4 }}>
              Entrar
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
              Acesse o painel com seu e-mail e senha.
            </Typography.Paragraph>

            {erro && <Alert type="error" showIcon title={erro} style={{ marginBottom: 16 }} />}

            <Form<CamposLogin>
              layout="vertical"
              requiredMark={false}
              onFinish={entrar}
              onValuesChange={() => erro && setErro(null)}
              disabled={enviando}
            >
              <Form.Item
                label="E-mail"
                name="email"
                rules={[
                  { required: true, message: 'Informe o e-mail.' },
                  { type: 'email', message: 'Informe um e-mail válido.' },
                ]}
              >
                <Input
                  type="email"
                  size="large"
                  autoComplete="email"
                  prefix={<MailOutlined style={{ color: cores.textoSecundario }} />}
                  placeholder="seu@email.com"
                />
              </Form.Item>

              <Form.Item
                label="Senha"
                name="senha"
                rules={[{ required: true, message: 'Informe a senha.' }]}
              >
                <Input.Password
                  size="large"
                  autoComplete="current-password"
                  prefix={<LockOutlined style={{ color: cores.textoSecundario }} />}
                  placeholder="Sua senha"
                />
              </Form.Item>

              <Button type="primary" htmlType="submit" size="large" block loading={enviando}>
                Entrar
              </Button>
            </Form>
          </Card>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link to="/">Ver animais disponíveis</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
