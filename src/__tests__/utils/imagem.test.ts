import { describe, expect, it } from 'vitest'
import { urlImagem } from '../../utils/imagem'

const CAMINHO = '/api/imagens/0f8b2c3d-1e2f-4a5b-8c6d-7e8f9a0b1c2d.jpg'

describe('urlImagem', () => {
  it.each(['https://fotos.exemplo/rex.jpg', 'http://fotos.exemplo/rex.png?v=2'])('URL http/https fica como está: %s', (url) => {
    expect(urlImagem(url, 'http://localhost:4000/api')).toBe(url)
    expect(urlImagem(url, '/api')).toBe(url)
  })

  it('base relativa (produção, mesmo domínio): o caminho continua relativo', () => {
    expect(urlImagem(CAMINHO, '/api')).toBe(CAMINHO)
    expect(urlImagem(CAMINHO, '/api/')).toBe(CAMINHO)
  })

  it('base absoluta (desenvolvimento): o caminho vai para o servidor da API', () => {
    expect(urlImagem(CAMINHO, 'http://localhost:4000/api')).toBe(
      'http://localhost:4000/api/imagens/0f8b2c3d-1e2f-4a5b-8c6d-7e8f9a0b1c2d.jpg',
    )
    expect(urlImagem(CAMINHO, 'https://api.exemplo.org/api/')).toBe(
      'https://api.exemplo.org/api/imagens/0f8b2c3d-1e2f-4a5b-8c6d-7e8f9a0b1c2d.jpg',
    )
  })

  it('API atrás de outro prefixo: respeita o caminho da base', () => {
    expect(urlImagem(CAMINHO, '/backend/api')).toBe('/backend/api/imagens/0f8b2c3d-1e2f-4a5b-8c6d-7e8f9a0b1c2d.jpg')
  })

  it('sem base configurada, usa o caminho no mesmo domínio', () => {
    expect(urlImagem(CAMINHO, undefined)).toBe(CAMINHO)
  })

  it('usa o VITE_API_URL por padrão (/api nos testes)', () => {
    expect(urlImagem(CAMINHO)).toBe(CAMINHO)
  })

  it('apara espaços', () => {
    expect(urlImagem(`  ${CAMINHO}  `, '/api')).toBe(CAMINHO)
  })

  it.each([undefined, null, '', '   ', 'javascript:alert(1)', 'data:image/png;base64,AAAA', 'ftp://x/a.png', 'foto.jpg', '/outra/rota.jpg'])(
    'sem imagem utilizável (%j): undefined',
    (url) => {
      expect(urlImagem(url, '/api')).toBeUndefined()
    },
  )
})
