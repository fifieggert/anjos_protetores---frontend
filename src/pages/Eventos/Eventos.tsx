import { useCallback, useEffect, useMemo, useState } from 'react'
import { App, Avatar, Button, Card, Col, Empty, Flex, Input, Popconfirm, Result, Row, Table, Tabs, Tag, Tooltip, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import {
  CalendarOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import Indicador from '../../components/Indicador'
import { excluirEvento, listarEventos } from '../../services/eventos'
import { cores, comOpacidade } from '../../theme/cores'
import type { Evento } from '../../types/evento'
import { diaDaApi, diaDaSemana, formatarDia, textoHorario } from '../../utils/datas'
import { mensagemDeErro, statusDoErro } from '../../utils/erros'
import { normalizar } from '../../utils/texto'
import ModalEvento from './ModalEvento'

const TAMANHO_PAGINA = 10

type Aba = 'proximos' | 'realizados' | 'todos'

const vazioDaAba: Record<Aba, string> = {
  proximos: 'Nenhum evento programado. Cadastre o próximo para ele aparecer na página pública.',
  realizados: 'Nenhum evento realizado ainda.',
  todos: 'Nenhum evento cadastrado ainda.',
}

// Um evento de hoje ainda conta como próximo (aparece na página pública durante o dia).
function realizado(evento: Evento) {
  return diaDaApi(evento.data)?.isBefore(dayjs(), 'day') ?? false
}

function ehHoje(evento: Evento) {
  return diaDaApi(evento.data)?.isSame(dayjs(), 'day') ?? false
}

function Eventos() {
  const { message } = App.useApp()

  const [eventos, setEventos] = useState<Evento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [falhou, setFalhou] = useState(false)
  const [aba, setAba] = useState<Aba>('proximos')
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)
  const [excluindo, setExcluindo] = useState<string | null>(null)
  // undefined = modal fechado; null = cadastro; Evento = edição
  const [modal, setModal] = useState<Evento | null | undefined>(undefined)

  // Incrementar a versão refaz a busca da lista.
  const [versaoLista, setVersaoLista] = useState(0)

  const carregar = useCallback(() => {
    setCarregando(true)
    setVersaoLista((versao) => versao + 1)
  }, [])

  // A lista vem inteira (uma requisição só) e é dividida nas abas aqui, comparando o dia com hoje.
  useEffect(() => {
    let ativo = true
    listarEventos()
      .then((lista) => {
        if (!ativo) return
        setEventos(Array.isArray(lista) ? lista : [])
        setFalhou(false)
      })
      .catch((e: unknown) => {
        if (!ativo) return
        setFalhou(true)
        message.error(mensagemDeErro(e, 'Não foi possível carregar os eventos.'))
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [versaoLista, message])

  // O backend devolve em ordem crescente de data e horário. Os realizados ficam do mais
  // recente para o mais antigo.
  const porAba = useMemo(() => {
    const proximos = eventos.filter((evento) => !realizado(evento))
    const realizados = eventos.filter(realizado).reverse()
    return { proximos, realizados, todos: eventos }
  }, [eventos])

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim())
    if (!termo) return porAba[aba]
    return porAba[aba].filter((evento) => normalizar(`${evento.titulo} ${evento.local}`).includes(termo))
  }, [porAba, aba, busca])

  async function excluir(evento: Evento) {
    setExcluindo(evento.id)
    try {
      await excluirEvento(evento.id)
      setEventos((lista) => lista.filter((atual) => atual.id !== evento.id))
      message.success('Evento excluído.')
    } catch (e) {
      message.error(mensagemDeErro(e, 'Não foi possível excluir o evento. Tente novamente.'))
      const status = statusDoErro(e)
      if (status === 404 || status === 409) carregar()
    } finally {
      setExcluindo(null)
    }
  }

  // A resposta do servidor substitui o evento; a lista é reordenada por data e horário.
  function aoSalvar(salvo: Evento, novo: boolean) {
    setEventos((lista) =>
      (novo ? [...lista, salvo] : lista.map((atual) => (atual.id === salvo.id ? salvo : atual))).sort((a, b) =>
        `${a.data} ${a.horarioInicio}`.localeCompare(`${b.data} ${b.horarioInicio}`),
      ),
    )
    setModal(undefined)
  }

  const colunas: TableColumnsType<Evento> = [
    {
      title: 'Evento',
      key: 'titulo',
      render: (_, evento) => (
        <Flex align="center" gap={12} style={{ minWidth: 200 }}>
          <Avatar
            shape="square"
            size={48}
            src={evento.imagemUrl || undefined}
            alt={evento.titulo}
            icon={<CalendarOutlined />}
            style={{
              flexShrink: 0,
              borderRadius: 10,
              color: cores.primaria,
              background: comOpacidade(cores.primaria, 0.12),
            }}
          />
          <Typography.Text strong style={{ maxWidth: 280 }} ellipsis={{ tooltip: evento.titulo }}>
            {evento.titulo}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: 'Data',
      key: 'data',
      render: (_, evento) => (
        <div style={{ whiteSpace: 'nowrap' }}>
          <Flex align="center" gap={6}>
            <span>{formatarDia(evento.data)}</span>
            {ehHoje(evento) && (
              <Tag color={cores.laranja} style={{ marginInlineEnd: 0 }}>
                Hoje
              </Tag>
            )}
          </Flex>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {diaDaSemana(evento.data)}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: 'Horário',
      key: 'horario',
      render: (_, evento) => <span style={{ whiteSpace: 'nowrap' }}>{textoHorario(evento.horarioInicio, evento.horarioFim)}</span>,
    },
    {
      title: 'Local',
      dataIndex: 'local',
      key: 'local',
      render: (local: string) => (
        <Typography.Text style={{ maxWidth: 240 }} ellipsis={{ tooltip: local }}>
          <EnvironmentOutlined aria-hidden style={{ marginRight: 6, color: cores.textoSecundario }} />
          {local}
        </Typography.Text>
      ),
    },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_, evento) => (
        <Flex gap={4}>
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined />}
              aria-label={`Editar o evento ${evento.titulo}`}
              onClick={() => setModal(evento)}
            />
          </Tooltip>
          <Popconfirm
            title="Excluir este evento?"
            description={
              <div style={{ maxWidth: 280 }}>
                O evento {evento.titulo} deixará de aparecer na página pública. Esta ação não pode ser desfeita.
              </div>
            }
            okText="Excluir"
            cancelText="Voltar"
            okButtonProps={{ danger: true }}
            onConfirm={() => excluir(evento)}
          >
            <Tooltip title="Excluir">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                aria-label={`Excluir o evento ${evento.titulo}`}
                loading={excluindo === evento.id}
              />
            </Tooltip>
          </Popconfirm>
        </Flex>
      ),
    },
  ]

  const abas = [
    { key: 'proximos', label: `Próximos (${porAba.proximos.length})` },
    { key: 'realizados', label: `Realizados (${porAba.realizados.length})` },
    { key: 'todos', label: `Todos (${porAba.todos.length})` },
  ]

  const conteudo = falhou ? (
    <Result
      status="warning"
      title="Não foi possível carregar os eventos."
      extra={
        <Button type="primary" onClick={carregar} loading={carregando}>
          Tentar de novo
        </Button>
      }
    />
  ) : (
    <Flex vertical gap={16}>
      <Input
        allowClear
        prefix={<SearchOutlined style={{ color: cores.textoSecundario }} />}
        placeholder="Buscar por título ou local"
        aria-label="Buscar por título ou local"
        value={busca}
        onChange={(e) => {
          setBusca(e.target.value)
          setPagina(1)
        }}
        style={{ maxWidth: 400 }}
      />
      <Table<Evento>
        rowKey="id"
        columns={colunas}
        dataSource={filtrados}
        loading={carregando}
        // eventos que já passaram ficam apagados (na aba "Todos" eles se misturam aos próximos)
        onRow={(evento) => (realizado(evento) ? { style: { opacity: 0.6 } } : {})}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={busca.trim() ? 'Nenhum evento encontrado para esta busca.' : vazioDaAba[aba]}
            />
          ),
        }}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: pagina,
          pageSize: TAMANHO_PAGINA,
          showSizeChanger: false,
          hideOnSinglePage: true,
          onChange: setPagina,
        }}
      />
    </Flex>
  )

  return (
    <Flex vertical gap={24}>
      <Flex justify="space-between" align="center" wrap gap={16}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          Eventos
        </Typography.Title>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setModal(null)}>
          Novo evento
        </Button>
      </Flex>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Indicador
            titulo="Próximos eventos"
            valor={porAba.proximos.length}
            icone={<CalendarOutlined />}
            cor={cores.primaria}
          />
        </Col>
        <Col xs={24} sm={12}>
          <Indicador
            titulo="Eventos realizados"
            valor={porAba.realizados.length}
            icone={<CheckCircleOutlined />}
            cor={cores.sucesso}
          />
        </Col>
      </Row>

      <Card styles={{ body: { paddingTop: 8 } }}>
        <Tabs
          activeKey={aba}
          onChange={(chave) => {
            setAba(chave as Aba)
            setPagina(1)
          }}
          items={abas}
        />
        {conteudo}
      </Card>

      <ModalEvento
        aberto={modal !== undefined}
        evento={modal ?? null}
        onFechar={() => setModal(undefined)}
        onSalvo={aoSalvar}
        onDesatualizado={carregar}
      />
    </Flex>
  )
}

export default Eventos
