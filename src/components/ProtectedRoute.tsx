import type { ReactNode } from 'react'
import { Button, Result, Spin } from 'antd'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { Perfil } from '../types/auth'

interface ProtectedRouteProps {
  perfisPermitidos?: Perfil[]
  children?: ReactNode
}

function ProtectedRoute({ perfisPermitidos, children }: ProtectedRouteProps) {
  const { usuario, carregando } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!usuario) {
    const origem = location.pathname + location.search + location.hash
    return <Navigate to="/login" replace state={{ from: origem }} />
  }

  if (perfisPermitidos && !perfisPermitidos.includes(usuario.perfil)) {
    return (
      <Result
        status="403"
        title="Acesso negado"
        subTitle="Você não tem permissão para acessar esta página."
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            Voltar para o Dashboard
          </Button>
        }
      />
    )
  }

  return children ?? <Outlet />
}

export default ProtectedRoute
