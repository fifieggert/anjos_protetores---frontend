import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import Dashboard from './pages/Dashboard/Dashboard'
import Animais from './pages/Animais/Animais'
import Doacoes from './pages/Doacoes/Doacoes'
import Adocoes from './pages/Adocoes/Adocoes'
import Relatorios from './pages/Relatorios/Relatorios'
import Login from './pages/Login/Login'
import Publico from './pages/Publico/Publico'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/publico" element={<Publico />} />

        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/animais" element={<Animais />} />
          <Route path="/doacoes" element={<Doacoes />} />
          <Route path="/adocoes" element={<Adocoes />} />
          <Route path="/relatorios" element={<Relatorios />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
