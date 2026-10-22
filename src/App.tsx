import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/Layout/AppLayout'
import Dashboard from './pages/Dashboard/Dashboard'
import Animais from './pages/Animais/Animais'
import Doacoes from './pages/Doacoes/Doacoes'
import Adocoes from './pages/Adocoes/Adocoes'
import Eventos from './pages/Eventos/Eventos'
import Relatorios from './pages/Relatorios/Relatorios'
import Login from './pages/Login/Login'
import Publico from './pages/Publico/Publico'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* página pública: inicial do site, sem login e sem o layout interno */}
          <Route path="/" element={<Publico />} />
          <Route path="/publico" element={<Navigate to="/" replace />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/animais" element={<Animais />} />
            <Route path="/doacoes" element={<Doacoes />} />
            <Route
              path="/adocoes"
              element={
                <ProtectedRoute perfisPermitidos={['ADMIN']}>
                  <Adocoes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/eventos"
              element={
                <ProtectedRoute perfisPermitidos={['ADMIN']}>
                  <Eventos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/relatorios"
              element={
                <ProtectedRoute perfisPermitidos={['ADMIN']}>
                  <Relatorios />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
