import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import ptBR from 'antd/locale/pt_BR'
import 'antd/dist/reset.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      locale={ptBR}
      theme={{
        token: {
          colorPrimary: '#0e9f8e',
          borderRadius: 8,
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
)
