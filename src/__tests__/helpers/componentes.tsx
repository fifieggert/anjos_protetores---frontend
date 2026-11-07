import type { ReactNode } from 'react'
import { App as AntdApp, ConfigProvider } from 'antd'
import ptBR from 'antd/locale/pt_BR'
import { useLocation } from 'react-router-dom'

// Mesmos provedores do main.tsx. Sem animação: o jsdom não dispara o fim das transições CSS,
// então um Modal ou Drawer nunca terminaria de fechar.
export function ProvedoresAntd({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider locale={ptBR} theme={{ token: { motion: false } }}>
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  )
}

// Mostra a rota atual e o state, para conferir redirecionamentos.
export function LocalAtual() {
  const { pathname, search, state } = useLocation()
  return (
    <>
      <span data-testid="caminho">{pathname + search}</span>
      <span data-testid="estado">{JSON.stringify(state)}</span>
    </>
  )
}
