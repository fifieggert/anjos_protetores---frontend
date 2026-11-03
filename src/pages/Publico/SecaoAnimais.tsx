import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Col, Empty, Flex, Result, Row, Segmented, Select, Skeleton, Typography } from 'antd'
import { listarAnimaisPublicos } from '../../services/publico'
import { PORTES, rotulosPorte } from '../../types/animal'
import type { Especie, Porte } from '../../types/animal'
import type { AnimalPublico, FiltrosAnimaisPublicos } from '../../types/publico'
import CartaoAnimal from './CartaoAnimal'
import ModalAnimal from './ModalAnimal'

type FiltroEspecie = Especie | 'TODOS'
type FiltroPorte = Porte | 'TODOS'

const OPCOES_ESPECIE: { label: string; value: FiltroEspecie }[] = [
  { label: 'Todos', value: 'TODOS' },
  { label: 'Cachorros', value: 'CACHORRO' },
  { label: 'Gatos', value: 'GATO' },
  { label: 'Outros', value: 'OUTRO' },
]

const OPCOES_PORTE: { label: string; value: FiltroPorte }[] = [
  { label: 'Todos os portes', value: 'TODOS' },
  ...PORTES.map((porte) => ({ label: rotulosPorte[porte], value: porte })),
]

const CARTOES_CARREGANDO = 4

function SecaoAnimais() {
  const [especie, setEspecie] = useState<FiltroEspecie>('TODOS')
  const [porte, setPorte] = useState<FiltroPorte>('TODOS')
  const [animais, setAnimais] = useState<AnimalPublico[]>([])
  const [carregando, setCarregando] = useState(true)
  const [falhou, setFalhou] = useState(false)
  const [selecionado, setSelecionado] = useState<AnimalPublico | null>(null)

  // Incrementar a versão refaz a busca da lista.
  const [versao, setVersao] = useState(0)

  const filtros = useMemo<FiltrosAnimaisPublicos>(
    () => ({
      ...(especie !== 'TODOS' ? { especie } : {}),
      ...(porte !== 'TODOS' ? { porte } : {}),
    }),
    [especie, porte],
  )

  useEffect(() => {
    let ativo = true
    listarAnimaisPublicos(filtros)
      .then((lista) => {
        if (!ativo) return
        setAnimais(Array.isArray(lista) ? lista : [])
        setFalhou(false)
      })
      .catch(() => {
        if (ativo) setFalhou(true)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [filtros, versao])

  const recarregar = useCallback(() => {
    setCarregando(true)
    setVersao((v) => v + 1)
  }, [])

  // Para o modal: busca a lista de novo e devolve os disponíveis (null se falhou),
  // para saber se o animal escolhido ainda está na lista.
  const conferirDisponiveis = useCallback(async () => {
    try {
      const lista = await listarAnimaisPublicos(filtros)
      const disponiveis = Array.isArray(lista) ? lista : []
      setAnimais(disponiveis)
      setFalhou(false)
      return disponiveis
    } catch {
      return null
    }
  }, [filtros])

  let conteudo
  if (falhou && !carregando) {
    conteudo = (
      <Result
        status="warning"
        title="Não foi possível carregar os animais."
        extra={
          <Button type="primary" onClick={recarregar}>
            Tentar de novo
          </Button>
        }
      />
    )
  } else if (carregando) {
    conteudo = (
      <Row gutter={[24, 24]} aria-busy="true">
        {Array.from({ length: CARTOES_CARREGANDO }, (_, i) => (
          <Col key={i} xs={24} sm={12} lg={8} xl={6}>
            <Card cover={<Skeleton.Node active style={{ width: '100%', height: 200 }} />}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          </Col>
        ))}
      </Row>
    )
  } else if (animais.length === 0) {
    conteudo = (
      <Card>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nenhum animal disponível com esse filtro no momento." />
      </Card>
    )
  } else {
    conteudo = (
      <Row gutter={[24, 24]}>
        {animais.map((animal) => (
          <Col key={animal.id} xs={24} sm={12} lg={8} xl={6}>
            <CartaoAnimal animal={animal} onVerMais={setSelecionado} />
          </Col>
        ))}
      </Row>
    )
  }

  return (
    <section id="animais" tabIndex={-1} className="pub-secao" aria-labelledby="titulo-animais">
      <div className="pub-container">
        <div className="pub-cabecalho-secao">
          <Typography.Title level={2} id="titulo-animais" style={{ marginTop: 0 }}>
            Amigos esperando por você
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 0 }}>
            Todos estes animais estão disponíveis para adoção. Clique em “Ver mais” para conhecer cada um.
          </Typography.Paragraph>
        </div>

        <Flex wrap gap={12} justify="center" align="center" style={{ marginBottom: 32 }}>
          {/* rolagem horizontal própria no celular, sem alargar a página */}
          <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
            <Segmented<FiltroEspecie>
              size="large"
              options={OPCOES_ESPECIE}
              value={especie}
              onChange={(valor) => {
                setEspecie(valor)
                setCarregando(true)
              }}
              aria-label="Filtrar por espécie"
            />
          </div>
          <Select<FiltroPorte>
            size="large"
            options={OPCOES_PORTE}
            value={porte}
            onChange={(valor) => {
              setPorte(valor)
              setCarregando(true)
            }}
            aria-label="Filtrar por porte"
            style={{ minWidth: 180 }}
          />
        </Flex>

        {conteudo}
      </div>

      <ModalAnimal
        animal={selecionado}
        onFechar={() => setSelecionado(null)}
        onInteresseRegistrado={recarregar}
        onConferirDisponiveis={conferirDisponiveis}
      />
    </section>
  )
}

export default SecaoAnimais
