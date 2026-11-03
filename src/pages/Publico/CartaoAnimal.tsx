import { Button, Card, Flex, Tag, Typography } from 'antd'
import { rotulosEspecie, rotulosPorte, rotulosSexo } from '../../types/animal'
import type { AnimalPublico } from '../../types/publico'
import { formatarIdade, rotulo } from '../../utils/texto'
import FotoAnimal from './FotoAnimal'

interface CartaoAnimalProps {
  animal: AnimalPublico
  onVerMais: (animal: AnimalPublico) => void
}

function CartaoAnimal({ animal, onVerMais }: CartaoAnimalProps) {
  const detalhes = [rotulo(rotulosPorte, animal.porte), animal.sexo ? rotulo(rotulosSexo, animal.sexo) : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <Card
      className="pub-cartao-animal"
      style={{ overflow: 'hidden' }}
      styles={{ body: { padding: 20, flex: 1 } }}
      cover={<FotoAnimal url={animal.fotoUrl} nome={animal.nome} />}
    >
      <Typography.Title level={3} style={{ margin: 0, fontSize: 20 }}>
        {animal.nome}
      </Typography.Title>
      <Typography.Text type="secondary">
        {rotulo(rotulosEspecie, animal.especie)} · {formatarIdade(animal.idade) ?? 'Idade não informada'}
      </Typography.Text>
      <Typography.Text type="secondary">{detalhes}</Typography.Text>

      {/* cores pré-definidas do antd: fundo claro e texto escuro, com bom contraste */}
      {(animal.vacinado || animal.castrado) && (
        <Flex wrap gap={6}>
          {animal.vacinado && <Tag color="cyan">Vacinado</Tag>}
          {animal.castrado && <Tag color="blue">Castrado</Tag>}
        </Flex>
      )}

      <Button
        type="primary"
        block
        style={{ marginTop: 'auto' }}
        aria-label={`Ver mais sobre ${animal.nome}`}
        onClick={() => onVerMais(animal)}
      >
        Ver mais
      </Button>
    </Card>
  )
}

export default CartaoAnimal
