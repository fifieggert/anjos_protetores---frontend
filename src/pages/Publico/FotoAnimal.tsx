import { useState } from 'react'
import type { CSSProperties } from 'react'
import IconePatinha from './IconePatinha'

interface FotoAnimalProps {
  url: string | null
  nome: string
  style?: CSSProperties
}

// Foto do animal; sem URL ou se a imagem não carregar, mostra a imagem padrão com patinha.
function FotoAnimal({ url, nome, style }: FotoAnimalProps) {
  const [falhou, setFalhou] = useState(false)

  if (!url || falhou) {
    return (
      <div className="pub-foto-padrao" role="img" aria-label={`${nome} (sem foto)`} style={style}>
        <IconePatinha tamanho={64} />
      </div>
    )
  }

  return (
    <img
      className="pub-foto"
      src={url}
      alt={`Foto de ${nome}`}
      loading="lazy"
      onError={() => setFalhou(true)}
      style={style}
    />
  )
}

export default FotoAnimal
