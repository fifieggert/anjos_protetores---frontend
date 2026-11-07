import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { InitialEntry } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import { ProvedoresAntd } from './componentes'

export function renderComAntd(elemento: ReactElement) {
  return render(<ProvedoresAntd>{elemento}</ProvedoresAntd>)
}

interface OpcoesRota {
  rota?: InitialEntry
}

export function renderComRota(elemento: ReactElement, { rota = '/' }: OpcoesRota = {}) {
  return render(
    <ProvedoresAntd>
      <MemoryRouter initialEntries={[rota]}>{elemento}</MemoryRouter>
    </ProvedoresAntd>,
  )
}

// Com o AuthProvider real: a sessão vem do localStorage (ver salvarSessao).
export function renderComAuth(elemento: ReactElement, opcoes: OpcoesRota = {}) {
  return renderComRota(<AuthProvider>{elemento}</AuthProvider>, opcoes)
}
