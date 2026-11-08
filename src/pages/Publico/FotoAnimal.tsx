import { useState } from 'react'
import type { CSSProperties } from 'react'
import IconePatinha from './IconePatinha'
import { urlImagem } from '../../utils/imagem'

interface FotoAnimalProps {
  url: string | null
  nome: string
  style?: CSSProperties
}

// Foto do animal; sem URL ou se a imagem não carregar, mostra a imagem padrão com patinha.
// url: caminho do upload (/api/imagens/...) ou link externo http(s).
function FotoAnimal({ url, nome, style }: FotoAnimalProps) {
  const [falhou, setFalhou] = useState(false)
  const src = urlImagem(url)

  if (!src || falhou) {
    return (
      <div className="pub-foto-padrao" role="img" aria-label={`${nome} (sem foto)`} style={style}>
        <IconePatinha tamanho={64} />
      </div>
    )
  }

  return (
    <img
      className="pub-foto"
      src={src}
      alt={`Foto de ${nome}`}
      loading="lazy"
      onError={() => setFalhou(true)}
      style={style}
    />
  )
}

export default FotoAnimal
