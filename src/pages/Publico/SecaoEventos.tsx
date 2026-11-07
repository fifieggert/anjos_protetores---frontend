import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import { Button, Card, Col, Empty, Flex, Grid, Result, Row, Skeleton, Typography } from 'antd'
import { ClockCircleOutlined, EnvironmentOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { listarEventosPublicos } from '../../services/publico'
import { cores } from '../../theme/cores'
import type { EventoPublico } from '../../types/publico'
import { diaDaApi, diaDaSemana, mesAbreviado, textoHorario } from '../../utils/datas'

// Seta na ponta do carrossel: aria-disabled em vez de disabled, porque um botão desabilitado
// perde o foco e o teclado deixaria de mover o carrossel. O clique não faz nada (mover limita).
const ESTILO_SETA_NO_LIMITE: CSSProperties = { opacity: 0.45, cursor: 'not-allowed' }

function CartaoEvento({ evento }: { evento: EventoPublico }) {
  const [imagemFalhou, setImagemFalhou] = useState(false)
  const dia = diaDaApi(evento.data)

  return (
    <Card
      style={{ overflow: 'hidden' }}
      styles={{ body: { padding: 20 } }}
      cover={
        evento.imagemUrl && !imagemFalhou ? (
          <img
            className="pub-capa"
            src={evento.imagemUrl}
            alt={`Imagem do evento ${evento.titulo}`}
            loading="lazy"
            onError={() => setImagemFalhou(true)}
          />
        ) : undefined
      }
    >
      <Flex gap={16} align="flex-start">
        <div className="pub-data-evento" aria-hidden>
          <strong>{dia?.format('DD') ?? '--'}</strong>
          <span>{mesAbreviado(evento.data)}</span>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Typography.Title level={4} style={{ margin: 0, fontSize: 18 }}>
            {evento.titulo}
          </Typography.Title>
          {/* a data em texto para leitores de tela (o bloco ao lado é visual) */}
          <Typography.Text type="secondary" style={{ display: 'block', fontSize: 13, textTransform: 'capitalize' }}>
            {dia ? `${diaDaSemana(evento.data)}, ${dia.format('DD/MM/YYYY')}` : ''}
          </Typography.Text>
        </div>
      </Flex>

      <Flex vertical gap={6} style={{ marginTop: 16 }}>
        <Typography.Text>
          <ClockCircleOutlined aria-hidden style={{ marginRight: 8, color: cores.primaria }} />
          {textoHorario(evento.horarioInicio, evento.horarioFim)}
        </Typography.Text>
        <Typography.Text>
          <EnvironmentOutlined aria-hidden style={{ marginRight: 8, color: cores.laranja }} />
          {evento.local}
        </Typography.Text>
      </Flex>

      {evento.descricao && (
        <Typography.Paragraph type="secondary" className="pub-texto-limitado" style={{ margin: '12px 0 0' }}>
          {evento.descricao}
        </Typography.Paragraph>
      )}
    </Card>
  )
}

function SecaoEventos() {
  const telas = Grid.useBreakpoint()
  const porTela = telas.lg ? 3 : telas.md ? 2 : 1

  const [eventos, setEventos] = useState<EventoPublico[]>([])
  const [carregando, setCarregando] = useState(true)
  const [falhou, setFalhou] = useState(false)
  const [versao, setVersao] = useState(0)
  const [inicio, setInicio] = useState(0)

  const carregar = useCallback(() => {
    setCarregando(true)
    setVersao((v) => v + 1)
  }, [])

  useEffect(() => {
    let ativo = true
    listarEventosPublicos()
      .then((lista) => {
        if (!ativo) return
        setEventos(Array.isArray(lista) ? lista : [])
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
  }, [versao])

  // Ao mudar o tamanho da tela, o início continua válido (sem espaço vazio no fim).
  const ultimoInicio = Math.max(0, eventos.length - porTela)
  const atual = Math.min(inicio, ultimoInicio)
  const temSetas = eventos.length > porTela

  function mover(passo: number) {
    setInicio(Math.max(0, Math.min(ultimoInicio, atual + passo)))
  }

  function aoTeclar(evento: KeyboardEvent<HTMLElement>) {
    if (evento.key === 'ArrowLeft') {
      evento.preventDefault()
      mover(-1)
    } else if (evento.key === 'ArrowRight') {
      evento.preventDefault()
      mover(1)
    }
  }

  let conteudo
  if (carregando) {
    conteudo = (
      <Row gutter={[24, 24]}>
        {Array.from({ length: porTela }, (_, i) => (
          <Col key={i} xs={24} md={12} lg={8}>
            <Card>
              <Skeleton active paragraph={{ rows: 4 }} />
            </Card>
          </Col>
        ))}
      </Row>
    )
  } else if (falhou) {
    conteudo = (
      <Result
        status="warning"
        title="Não foi possível carregar os eventos."
        extra={
          <Button type="primary" onClick={carregar}>
            Tentar de novo
          </Button>
        }
      />
    )
  } else if (eventos.length === 0) {
    conteudo = (
      <Card>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nenhum evento agendado no momento. Volte em breve!" />
      </Card>
    )
  } else {
    const fim = Math.min(atual + porTela, eventos.length)
    conteudo = (
      <div
        role="region"
        aria-roledescription="carrossel"
        aria-label="Próximos eventos"
      >
        <div className="pub-carrossel-janela">
          <div
            className="pub-carrossel-trilha"
            style={
              {
                '--pub-por-tela': porTela,
                transform: `translateX(calc(-${atual} * ((100% - ${porTela - 1} * var(--pub-espaco)) / ${porTela} + var(--pub-espaco))))`,
              } as CSSProperties
            }
          >
            {eventos.map((evento, i) => {
              const visivel = i >= atual && i < fim
              return (
                <div
                  key={evento.id}
                  className="pub-carrossel-item"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} de ${eventos.length}`}
                  aria-hidden={!visivel}
                  // cartões fora da tela não recebem foco
                  inert={!visivel}
                >
                  <CartaoEvento evento={evento} />
                </div>
              )
            })}
          </div>
        </div>

        {temSetas && (
          <Flex align="center" justify="center" gap={16} style={{ marginTop: 24 }}>
            <Button
              shape="circle"
              size="large"
              icon={<LeftOutlined />}
              aria-label="Eventos anteriores"
              aria-disabled={atual === 0}
              style={atual === 0 ? ESTILO_SETA_NO_LIMITE : undefined}
              onClick={() => mover(-1)}
              onKeyDown={aoTeclar}
            />
            <Typography.Text type="secondary" aria-live="polite">
              {atual + 1}–{fim} de {eventos.length}
            </Typography.Text>
            <Button
              shape="circle"
              size="large"
              icon={<RightOutlined />}
              aria-label="Próximos eventos"
              aria-disabled={atual >= ultimoInicio}
              style={atual >= ultimoInicio ? ESTILO_SETA_NO_LIMITE : undefined}
              onClick={() => mover(1)}
              onKeyDown={aoTeclar}
            />
          </Flex>
        )}
      </div>
    )
  }

  return (
    <section id="eventos" tabIndex={-1} className="pub-secao pub-secao--alternada" aria-labelledby="titulo-eventos">
      <div className="pub-container">
        <div className="pub-cabecalho-secao">
          <Typography.Title level={2} id="titulo-eventos" style={{ marginTop: 0 }}>
            Próximos eventos
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 0 }}>
            Feiras de adoção e encontros para conhecer os animais e a equipe do abrigo.
          </Typography.Paragraph>
        </div>
        {conteudo}
      </div>
    </section>
  )
}

export default SecaoEventos
