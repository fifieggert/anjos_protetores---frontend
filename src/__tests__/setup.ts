import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// getByRole confere se cada elemento está acessível com getComputedStyle, e no jsdom isso
// compara cada ancestral com todo o CSS do antd: segundos por consulta numa página grande.
// Aqui a consulta não faz essa checagem; quem precisa dela passa { hidden: false }.
configure({ defaultHidden: true, asyncUtilTimeout: 5000 })

// O jsdom não implementa estas APIs do navegador, usadas pelo antd (Grid, Select, Modal).
// matchMedia sempre "não casa": o antd enxerga a menor tela, sem os blocos de telas grandes.
function instalarApisDoNavegador() {
  window.matchMedia = vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia

  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  Element.prototype.scrollIntoView = vi.fn()

  // O antd mede a barra de rolagem com pseudo-elementos, que o jsdom não suporta
  // (sem isto, cada Modal imprime "Not implemented" no console).
  const getComputedStyleOriginal = window.getComputedStyle.bind(window)
  window.getComputedStyle = (elemento: Element) => getComputedStyleOriginal(elemento)
}

// Antes de cada teste, porque vi.restoreAllMocks/unstubAllGlobals não podem levar estes stubs.
beforeEach(() => {
  instalarApisDoNavegador()
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})
