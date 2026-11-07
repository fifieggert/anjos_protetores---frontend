import { normalizar } from '../../utils/texto'

// Nome do PDF do termo a partir do nome do animal. O primeiro replace já junta cada sequência
// de caracteres especiais em um só hífen, então sobra no máximo um em cada ponta.
export function nomeArquivoTermo(nomeAnimal: string) {
  const slug = normalizar(nomeAnimal)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `termo-adocao-${slug || 'animal'}.pdf`
}
