import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Alert, Button, Card, Col, Flex, Progress, Result, Row, Skeleton, Statistic, Tag, Typography } from 'antd'
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  HeartOutlined,
  HomeOutlined,
  PhoneOutlined,
  ReloadOutlined,
  SmileOutlined,
} from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { buscarPainel } from '../../services/dashboard'
import { cores, comOpacidade, coresStatusAnimal } from '../../theme/cores'
import { STATUS_ANIMAL, rotulosEspecie, rotulosStatusAnimal } from '../../types/animal'
import type { EstadoTelaEstoque } from '../../types/estoque'
import type { DoacoesDoPainel, EstoqueDoPainel, Painel } from '../../types/dashboard'
import type { EventoPublico } from '../../types/publico'
import { formatarData, formatarDia, mesAbreviado, textoHorario } from '../../utils/datas'
import { mensagemDeErro } from '../../utils/erros'
import GraficoAdocoes from './GraficoAdocoes'

const MENSAGEM_ERRO = 'Não foi possível carregar o painel.'

// Busca o painel ao abrir a tela e quando o usuário pede para atualizar.
function usePainel() {
  const [painel, setPainel] = useState<Painel | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  // Só a busca mais recente pode mudar a tela (cliques seguidos em "Atualizar" ou sair da página).
  const ultimaBusca = useRef(0)

  // Faz a requisição; o estado só muda quando a resposta chega.
  const buscar = useCallback(() => {
    const busca = ++ultimaBusca.current
    buscarPainel()
      .then((dados) => {
        if (busca === ultimaBusca.current) {
          setPainel(dados)
          setErro(null)
        }
      })
      .catch((e: unknown) => {
        if (busca === ultimaBusca.current) setErro(mensagemDeErro(e, MENSAGEM_ERRO))
      })
      .finally(() => {
        if (busca === ultimaBusca.current) setCarregando(false)
      })
  }, [])

  // Primeira busca ao abrir a tela (o estado inicial já é "carregando").
  useEffect(() => {
    const buscas = ultimaBusca
    buscar()
    // ao sair da tela, respostas que ainda chegarem são ignoradas
    return () => {
      buscas.current++
    }
  }, [buscar])

  // Botão "Atualizar" / "Tentar novamente".
  const carregar = useCallback(() => {
    setCarregando(true)
    setErro(null)
    buscar()
  }, [buscar])

  return { painel, erro, carregando, carregar }
}

function percentual(parte: number, total: number) {
  return total > 0 ? Math.round((parte / total) * 100) : 0
}

function plural(n: number, singular: string, pluralTexto: string) {
  return `${n.toLocaleString('pt-BR')} ${n === 1 ? singular : pluralTexto}`
}

// ---- Peças de layout ----

interface CartaoNumeroProps {
  titulo: string
  valor: number
  icone: ReactNode
  cor: string
  link?: { para: string; texto: string }
}

function CartaoNumero({ titulo, valor, icone, cor, link }: CartaoNumeroProps) {
  return (
    <Card style={{ height: '100%' }} styles={{ body: { padding: 20 } }}>
      <Flex align="center" gap={16}>
        <Flex
          align="center"
          justify="center"
          aria-hidden
          style={{
            width: 48,
            height: 48,
            flexShrink: 0,
            borderRadius: 14,
            fontSize: 22,
            color: cor,
            background: comOpacidade(cor, 0.12),
          }}
        >
          {icone}
        </Flex>
        <div style={{ minWidth: 0 }}>
          <Statistic
            title={titulo}
            value={valor}
            groupSeparator="."
            styles={{ content: { fontSize: 26, fontWeight: 700, lineHeight: 1.2 } }}
          />
          {link && (
            <Link to={link.para} style={{ fontSize: 13 }}>
              {link.texto}
            </Link>
          )}
        </div>
      </Flex>
    </Card>
  )
}

interface SecaoProps {
  titulo: string
  extra?: ReactNode
  children: ReactNode
}

function Secao({ titulo, extra, children }: SecaoProps) {
  return (
    <Card title={titulo} extra={extra} style={{ height: '100%' }}>
      {children}
    </Card>
  )
}

// Estado vazio dentro de um cartão. "positivo" = boa notícia (ex.: estoque em dia).
function Vazio({ texto, positivo = false }: { texto: string; positivo?: boolean }) {
  return (
    <Flex vertical align="center" gap={8} style={{ padding: '24px 0', textAlign: 'center' }}>
      {positivo ? (
        <CheckCircleOutlined style={{ fontSize: 32, color: cores.sucesso }} aria-hidden />
      ) : (
        <SmileOutlined style={{ fontSize: 32, color: cores.textoSecundario }} aria-hidden />
      )}
      <Typography.Text type={positivo ? undefined : 'secondary'} strong={positivo}>
        {texto}
      </Typography.Text>
    </Flex>
  )
}

const estiloLista = { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 } as const

// ---- Seções ----

function SecaoAnimais({ animais }: { animais: Painel['animais'] }) {
  return (
    <Secao titulo="Animais" extra={<Link to="/animais">Ver animais</Link>}>
      <Typography.Text type="secondary" strong style={{ display: 'block', marginBottom: 8 }}>
        Por status
      </Typography.Text>
      <ul style={estiloLista}>
        {STATUS_ANIMAL.map((status) => {
          const total = animais.porStatus[status]
          return (
            <li key={status}>
              <Flex justify="space-between" align="center">
                <Tag color={coresStatusAnimal[status]}>{rotulosStatusAnimal[status]}</Tag>
                <Typography.Text strong>{total.toLocaleString('pt-BR')}</Typography.Text>
              </Flex>
              <Progress
                percent={percentual(total, animais.total)}
                showInfo={false}
                strokeColor={coresStatusAnimal[status]}
                railColor={cores.fundoSuave}
                size="small"
                aria-label={`${rotulosStatusAnimal[status]}: ${plural(total, 'animal', 'animais')}`}
              />
            </li>
          )
        })}
      </ul>

      <Typography.Text type="secondary" strong style={{ display: 'block', margin: '20px 0 8px' }}>
        Por espécie
      </Typography.Text>
      <Flex wrap gap={8}>
        {animais.porEspecie.map(({ especie, total }) => (
          <Tag key={especie} style={{ padding: '4px 10px', fontSize: 13 }}>
            {rotulosEspecie[especie]}: <strong>{total.toLocaleString('pt-BR')}</strong>
          </Tag>
        ))}
      </Flex>
    </Secao>
  )
}

function SecaoEstoque({ estoque }: { estoque: EstoqueDoPainel }) {
  // abre a tela de Doações e Estoque já filtrando os itens abaixo do mínimo
  const estado: EstadoTelaEstoque = { verEstoqueBaixo: estoque.itensAbaixoDoMinimo > 0 }
  const restantes = estoque.itensAbaixoDoMinimo - estoque.itens.length

  return (
    <Secao
      titulo="Estoque baixo"
      extra={
        <Link to="/doacoes" state={estado}>
          Ver estoque
        </Link>
      }
    >
      {estoque.itensAbaixoDoMinimo === 0 ? (
        <Vazio texto="Nenhum item abaixo do mínimo." positivo />
      ) : (
        <>
          <Typography.Text strong style={{ display: 'block', marginBottom: 12, color: cores.laranja }}>
            {plural(estoque.itensAbaixoDoMinimo, 'item abaixo do mínimo', 'itens abaixo do mínimo')}
          </Typography.Text>
          <ul style={estiloLista}>
            {estoque.itens.map((item) => {
              const esgotado = item.quantidadeAtual === 0
              return (
                <li key={item.id}>
                  <Flex justify="space-between" gap={8}>
                    <Typography.Text ellipsis style={{ minWidth: 0 }}>
                      {item.nomeItem}
                    </Typography.Text>
                    <Typography.Text type={esgotado ? 'danger' : 'secondary'} style={{ flexShrink: 0 }}>
                      {esgotado ? 'esgotado' : `${item.quantidadeAtual} de ${item.quantidadeMinima}`}
                    </Typography.Text>
                  </Flex>
                  <Progress
                    percent={Math.min(100, percentual(item.quantidadeAtual, item.quantidadeMinima))}
                    showInfo={false}
                    strokeColor={cores.laranja}
                    railColor={comOpacidade(cores.erro, 0.15)}
                    size="small"
                    aria-label={`${item.nomeItem}: ${item.quantidadeAtual} de ${item.quantidadeMinima} (mínimo)`}
                  />
                </li>
              )
            })}
          </ul>
          {restantes > 0 && (
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
              e mais {restantes}
            </Typography.Text>
          )}
        </>
      )}
    </Secao>
  )
}

function SecaoDoacoes({ doacoes }: { doacoes: DoacoesDoPainel }) {
  return (
    <Secao titulo="Doações" extra={<Link to="/doacoes">Ver doações</Link>}>
      <Statistic
        title="Registros de doação neste mês"
        value={doacoes.totalNoMes}
        groupSeparator="."
        styles={{ content: { fontWeight: 700 } }}
      />
      <Typography.Text type="secondary" strong style={{ display: 'block', margin: '20px 0 8px' }}>
        Mais recentes
      </Typography.Text>
      {doacoes.recentes.length === 0 ? (
        <Vazio texto="Nenhuma doação registrada ainda." />
      ) : (
        <ul style={estiloLista}>
          {doacoes.recentes.map((doacao) => (
            <li key={doacao.id}>
              <Flex justify="space-between" gap={8}>
                <Typography.Text strong ellipsis style={{ minWidth: 0 }}>
                  {doacao.doador}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ flexShrink: 0 }}>
                  {formatarData(doacao.dataEntrada)}
                </Typography.Text>
              </Flex>
              <Typography.Text type="secondary">
                {doacao.quantidade.toLocaleString('pt-BR')} × {doacao.item.nomeItem}
              </Typography.Text>
            </li>
          ))}
        </ul>
      )}
    </Secao>
  )
}

function SecaoEventos({ eventos }: { eventos: EventoPublico[] }) {
  return (
    <Secao titulo="Próximos eventos" extra={<Link to="/eventos">Ver eventos</Link>}>
      {eventos.length === 0 ? (
        <Vazio texto="Nenhum evento programado." />
      ) : (
        <ul style={estiloLista}>
          {eventos.map((evento) => (
            <li key={evento.id}>
              <Flex gap={12} align="center">
                {/* "calendário" com dia e mês; a data completa vai no texto ao lado */}
                <Flex
                  vertical
                  align="center"
                  justify="center"
                  aria-hidden
                  style={{
                    width: 48,
                    height: 48,
                    flexShrink: 0,
                    borderRadius: 12,
                    lineHeight: 1.1,
                    color: cores.primaria,
                    background: comOpacidade(cores.primaria, 0.1),
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 17 }}>{evento.data.slice(8, 10)}</span>
                  <span style={{ fontSize: 11, textTransform: 'uppercase' }}>{mesAbreviado(evento.data)}</span>
                </Flex>
                <div style={{ minWidth: 0 }}>
                  <Typography.Text strong ellipsis style={{ display: 'block' }}>
                    {evento.titulo}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ display: 'block', fontSize: 13 }}>
                    {formatarDia(evento.data)}, {textoHorario(evento.horarioInicio, evento.horarioFim)}
                  </Typography.Text>
                  <Typography.Text type="secondary" ellipsis style={{ display: 'block', fontSize: 13 }}>
                    {evento.local}
                  </Typography.Text>
                </div>
              </Flex>
            </li>
          ))}
        </ul>
      )}
    </Secao>
  )
}

// ---- Página ----

// Colunas: 5 cartões de número que se ajustam à largura; depois 2 e 3 cartões por linha
// no computador, 1 por linha no celular.
const COLUNA_NUMERO = { flex: '1 1 200px' }

function Carregando() {
  return (
    <Row gutter={[16, 16]}>
      {Array.from({ length: 5 }, (_, i) => (
        <Col key={`n${i}`} {...COLUNA_NUMERO}>
          <Card>
            <Skeleton active avatar paragraph={{ rows: 1 }} title={false} />
          </Card>
        </Col>
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <Col key={`s${i}`} xs={24} lg={i < 2 ? 12 : 8}>
          <Card>
            <Skeleton active paragraph={{ rows: 5 }} />
          </Card>
        </Col>
      ))}
    </Row>
  )
}

function Dashboard() {
  const { painel, erro, carregando, carregar } = usePainel()

  let conteudo: ReactNode
  if (!painel && carregando) {
    conteudo = <Carregando />
  } else if (!painel) {
    conteudo = (
      <Result
        status="warning"
        title={erro ?? MENSAGEM_ERRO}
        extra={
          <Button type="primary" onClick={carregar}>
            Tentar novamente
          </Button>
        }
      />
    )
  } else {
    const { animais, adocoes, estoque, doacoes, eventos } = painel
    conteudo = (
      <Flex vertical gap={16}>
        {/* falha ao ATUALIZAR: mantém os números anteriores na tela e avisa */}
        {erro && (
          <Alert
            type="warning"
            showIcon
            title={`${erro} Os números abaixo podem estar desatualizados.`}
            action={
              <Button size="small" onClick={carregar}>
                Tentar novamente
              </Button>
            }
          />
        )}

        <Row gutter={[16, 16]}>
          <Col {...COLUNA_NUMERO}>
            <CartaoNumero titulo="Animais cadastrados" valor={animais.total} icone={<HeartOutlined />} cor={cores.primaria} />
          </Col>
          <Col {...COLUNA_NUMERO}>
            <CartaoNumero
              titulo="Solicitações pendentes"
              valor={adocoes.pendentes}
              icone={<ClockCircleOutlined />}
              cor={cores.laranja}
              link={{ para: '/adocoes', texto: 'Ver adoções' }}
            />
          </Col>
          <Col {...COLUNA_NUMERO}>
            <CartaoNumero titulo="Em contato" valor={adocoes.emContato} icone={<PhoneOutlined />} cor={cores.primaria} />
          </Col>
          <Col {...COLUNA_NUMERO}>
            <CartaoNumero titulo="Adoções no mês" valor={adocoes.concluidasNoMes} icone={<HomeOutlined />} cor={cores.teal} />
          </Col>
          <Col {...COLUNA_NUMERO}>
            <CartaoNumero
              titulo="Adoções no total"
              valor={adocoes.concluidasTotal}
              icone={<CheckCircleOutlined />}
              cor={cores.sucesso}
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <SecaoAnimais animais={animais} />
          </Col>
          <Col xs={24} lg={12}>
            <Secao titulo="Adoções por mês" extra={<CalendarOutlined aria-hidden style={{ color: cores.textoSecundario }} />}>
              <GraficoAdocoes meses={adocoes.porMes} />
            </Secao>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12} xl={8}>
            <SecaoEstoque estoque={estoque} />
          </Col>
          <Col xs={24} md={12} xl={8}>
            <SecaoDoacoes doacoes={doacoes} />
          </Col>
          <Col xs={24} xl={8}>
            <SecaoEventos eventos={eventos.proximos} />
          </Col>
        </Row>
      </Flex>
    )
  }

  return (
    <Flex vertical gap={24}>
      <Flex justify="space-between" align="center" wrap gap={12}>
        <div>
          <Typography.Title level={2} style={{ margin: 0 }}>
            Dashboard
          </Typography.Title>
          <Typography.Text type="secondary">Visão geral do abrigo</Typography.Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={carregar} loading={carregando && !!painel}>
          Atualizar
        </Button>
      </Flex>
      {conteudo}
    </Flex>
  )
}

export default Dashboard
