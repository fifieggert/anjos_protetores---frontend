import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  ConfigProvider,
  Flex,
  Input,
  Popconfirm,
  Progress,
  Row,
  Select,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { TableColumnsType } from 'antd'
import {
  AppstoreOutlined,
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  GiftOutlined,
  InboxOutlined,
  PlusOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useLocation, useNavigate } from 'react-router-dom'
import Indicador from '../../components/Indicador'
import { useAuth } from '../../contexts/AuthContext'
import {
  excluirDoacao,
  excluirItem,
  excluirSaida,
  listarDoacoes,
  listarItens,
  listarSaidas,
} from '../../services/estoque'
import { cores } from '../../theme/cores'
import { CATEGORIAS, rotulosCategoria } from '../../types/estoque'
import type { CategoriaItem, Doacao, EstadoTelaEstoque, ItemEstoque, SaidaEstoque } from '../../types/estoque'
import { mensagemDeErro, statusDoErro } from '../../utils/erros'
import { formatarData } from '../../utils/datas'
import { normalizar, rotulo } from '../../utils/texto'
import ModalItem from './ModalItem'
import ModalDoacao from './ModalDoacao'
import ModalSaida from './ModalSaida'

const TODOS = 'TODOS'
const TAMANHO_PAGINA = 10

type Aba = 'estoque' | 'doacoes' | 'saidas'
type Situacao = 'ESGOTADO' | 'BAIXO' | 'OK'

const rotulosSituacao: Record<Situacao, string> = {
  ESGOTADO: 'Esgotado',
  BAIXO: 'Estoque baixo',
  OK: 'Em dia',
}

const coresSituacao: Record<Situacao, string> = {
  ESGOTADO: cores.erro,
  BAIXO: cores.laranja,
  OK: cores.sucesso,
}

const coresCategoria: Record<CategoriaItem, string> = {
  RACAO: cores.laranja,
  MEDICAMENTO: cores.erro,
  HIGIENE: cores.teal,
  LIMPEZA: cores.primaria,
  ACESSORIO: cores.textoSecundario,
}

const opcoesCategoria = CATEGORIAS.map((valor) => ({ value: valor, label: rotulosCategoria[valor] }))

// quantidadeMinima 0 = sem alerta (mesma regra do backend).
function abaixoDoMinimo(item: ItemEstoque) {
  return item.quantidadeMinima > 0 && item.quantidadeAtual < item.quantidadeMinima
}

function situacao(item: ItemEstoque): Situacao {
  if (item.quantidadeAtual === 0) return 'ESGOTADO'
  return abaixoDoMinimo(item) ? 'BAIXO' : 'OK'
}

// "Estoque baixo" no filtro inclui os esgotados que têm mínimo (são os que geram alerta).
function correspondeSituacao(item: ItemEstoque, filtro: Situacao) {
  return filtro === 'BAIXO' ? abaixoDoMinimo(item) : situacao(item) === filtro
}

function temMovimentacoes(item: ItemEstoque) {
  return (item.doacoes?.length ?? 0) > 0 || (item.saidas?.length ?? 0) > 0
}

function ordenarPorData(a: string, b: string) {
  return dayjs(a).valueOf() - dayjs(b).valueOf()
}

function TagCategoria({ categoria }: { categoria: CategoriaItem | undefined }) {
  if (!categoria) return null
  return (
    <Tag color={coresCategoria[categoria] ?? cores.textoSecundario}>{rotulo(rotulosCategoria, categoria)}</Tag>
  )
}

// Modal aberto: o registro sendo editado (null = cadastro) e o item pré-selecionado.
type ModalAberto =
  | { tipo: 'item'; item: ItemEstoque | null }
  | { tipo: 'doacao'; doacao: Doacao | null; itemId?: string }
  | { tipo: 'saida'; saida: SaidaEstoque | null; itemId?: string }
  | null

function Doacoes() {
  const { message } = App.useApp()
  const { usuario } = useAuth()
  const ehAdmin = usuario?.perfil === 'ADMIN'
  const location = useLocation()
  const navigate = useNavigate()

  const [itens, setItens] = useState<ItemEstoque[]>([])
  const [doacoes, setDoacoes] = useState<Doacao[]>([])
  const [saidas, setSaidas] = useState<SaidaEstoque[]>([])
  const [carregando, setCarregando] = useState(true)

  const [aba, setAba] = useState<Aba>('estoque')
  const [modal, setModal] = useState<ModalAberto>(null)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  // Filtros e paginação de cada aba.
  const [buscaItem, setBuscaItem] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaItem | typeof TODOS>(TODOS)
  const [filtroSituacao, setFiltroSituacao] = useState<Situacao | typeof TODOS>(TODOS)
  const [paginaItens, setPaginaItens] = useState(1)
  const [buscaDoacao, setBuscaDoacao] = useState('')
  const [paginaDoacoes, setPaginaDoacoes] = useState(1)
  const [buscaSaida, setBuscaSaida] = useState('')
  const [paginaSaidas, setPaginaSaidas] = useState(1)

  // Incrementar a versão refaz a busca de tudo.
  const [versaoLista, setVersaoLista] = useState(0)

  const carregar = useCallback(() => {
    setCarregando(true)
    setVersaoLista((versao) => versao + 1)
  }, [])

  useEffect(() => {
    let ativo = true
    Promise.allSettled([listarItens(), listarDoacoes(), ehAdmin ? listarSaidas() : Promise.resolve([])])
      .then(([resItens, resDoacoes, resSaidas]) => {
        if (!ativo) return
        if (resItens.status === 'fulfilled') setItens(Array.isArray(resItens.value) ? resItens.value : [])
        else message.error(mensagemDeErro(resItens.reason, 'Não foi possível carregar o estoque.'))

        if (resDoacoes.status === 'fulfilled') setDoacoes(Array.isArray(resDoacoes.value) ? resDoacoes.value : [])
        else message.error(mensagemDeErro(resDoacoes.reason, 'Não foi possível carregar as doações.'))

        if (resSaidas.status === 'fulfilled') setSaidas(Array.isArray(resSaidas.value) ? resSaidas.value : [])
        else message.error(mensagemDeErro(resSaidas.reason, 'Não foi possível carregar as saídas.'))
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [versaoLista, ehAdmin, message])

  // Doações e saídas mudam o saldo: recarrega só os itens, sem piscar as tabelas.
  const atualizarItens = useCallback(() => {
    listarItens()
      .then((lista) => setItens(Array.isArray(lista) ? lista : []))
      .catch((e: unknown) => message.error(mensagemDeErro(e, 'Não foi possível atualizar o estoque.')))
  }, [message])

  const itensBaixos = useMemo(
    () => itens.filter(abaixoDoMinimo).sort((a, b) => a.quantidadeAtual - b.quantidadeAtual),
    [itens],
  )

  const indicadoresDoMes = useMemo(() => {
    const inicioDoMes = dayjs().startOf('month')
    const doMes = doacoes.filter((doacao) => !dayjs(doacao.dataEntrada).isBefore(inicioDoMes))
    return {
      doacoes: doMes.length,
      unidades: doMes.reduce((total, doacao) => total + doacao.quantidade, 0),
    }
  }, [doacoes])

  const itensFiltrados = useMemo(() => {
    const termo = normalizar(buscaItem.trim())
    return itens.filter((item) => {
      if (filtroCategoria !== TODOS && item.categoria !== filtroCategoria) return false
      if (filtroSituacao !== TODOS && !correspondeSituacao(item, filtroSituacao)) return false
      return !termo || normalizar(item.nomeItem ?? '').includes(termo)
    })
  }, [itens, buscaItem, filtroCategoria, filtroSituacao])

  const doacoesFiltradas = useMemo(() => {
    const termo = normalizar(buscaDoacao.trim())
    if (!termo) return doacoes
    return doacoes.filter((doacao) => normalizar(`${doacao.doador ?? ''} ${doacao.item?.nomeItem ?? ''}`).includes(termo))
  }, [doacoes, buscaDoacao])

  const saidasFiltradas = useMemo(() => {
    const termo = normalizar(buscaSaida.trim())
    if (!termo) return saidas
    return saidas.filter((saida) => normalizar(`${saida.finalidade ?? ''} ${saida.item?.nomeItem ?? ''}`).includes(termo))
  }, [saidas, buscaSaida])

  function verItensBaixos() {
    setAba('estoque')
    setBuscaItem('')
    setFiltroCategoria(TODOS)
    setFiltroSituacao('BAIXO')
    setPaginaItens(1)
  }

  // Vindo do card "Estoque baixo" do menu: aplica o filtro uma vez por navegação (ajustando o
  // estado na renderização) e depois limpa o estado da navegação, para o filtro não voltar
  // sozinho num F5 ou ao usar o botão Voltar.
  const verEstoqueBaixo = (location.state as EstadoTelaEstoque | null)?.verEstoqueBaixo === true
  const [navegacaoAplicada, setNavegacaoAplicada] = useState<string | null>(null)
  if (verEstoqueBaixo && navegacaoAplicada !== location.key) {
    setNavegacaoAplicada(location.key)
    verItensBaixos()
  }
  useEffect(() => {
    if (verEstoqueBaixo) navigate(location.pathname, { replace: true, state: null })
  }, [verEstoqueBaixo, location.pathname, navigate])

  // Salvamentos vindos dos modais

  function aoSalvarItem(item: ItemEstoque, novo: boolean) {
    setItens((lista) => (novo ? [item, ...lista] : lista.map((atual) => (atual.id === item.id ? item : atual))))
    if (!novo) {
      // Nome e categoria aparecem nas movimentações já carregadas.
      const atualizarItem = <T extends { itemId: string; item: ItemEstoque | null }>(registro: T) =>
        registro.itemId === item.id ? { ...registro, item: { ...registro.item, ...item } } : registro
      setDoacoes((lista) => lista.map(atualizarItem))
      setSaidas((lista) => lista.map(atualizarItem))
    }
    setModal(null)
  }

  function aoSalvarDoacao(doacao: Doacao, nova: boolean) {
    setDoacoes((lista) => (nova ? [doacao, ...lista] : lista.map((atual) => (atual.id === doacao.id ? doacao : atual))))
    if (nova) atualizarItens()
    setModal(null)
  }

  function aoSalvarSaida(saida: SaidaEstoque, nova: boolean) {
    setSaidas((lista) => (nova ? [saida, ...lista] : lista.map((atual) => (atual.id === saida.id ? saida : atual))))
    if (nova) atualizarItens()
    setModal(null)
  }

  function aoDesatualizar() {
    setModal(null)
    carregar()
  }

  // Exclusões

  async function excluir(id: string, acao: () => Promise<void>, sucesso: string, generica: string) {
    setExcluindoId(id)
    try {
      await acao()
      message.success(sucesso)
    } catch (e) {
      message.error(mensagemDeErro(e, generica))
      if (statusDoErro(e) === 404) carregar()
    } finally {
      setExcluindoId(null)
    }
  }

  function removerItem(item: ItemEstoque) {
    return excluir(
      item.id,
      async () => {
        await excluirItem(item.id)
        setItens((lista) => lista.filter((atual) => atual.id !== item.id))
      },
      'Item excluído.',
      'Não foi possível excluir o item. Tente novamente.',
    )
  }

  function removerDoacao(doacao: Doacao) {
    return excluir(
      doacao.id,
      async () => {
        await excluirDoacao(doacao.id)
        setDoacoes((lista) => lista.filter((atual) => atual.id !== doacao.id))
        atualizarItens()
      },
      'Doação excluída. A quantidade foi retirada do estoque.',
      'Não foi possível excluir a doação. Tente novamente.',
    )
  }

  function removerSaida(saida: SaidaEstoque) {
    return excluir(
      saida.id,
      async () => {
        await excluirSaida(saida.id)
        setSaidas((lista) => lista.filter((atual) => atual.id !== saida.id))
        atualizarItens()
      },
      'Saída excluída. A quantidade voltou ao estoque.',
      'Não foi possível excluir a saída. Tente novamente.',
    )
  }

  // Colunas

  const colunasItens: TableColumnsType<ItemEstoque> = [
    {
      title: 'Item',
      dataIndex: 'nomeItem',
      key: 'nomeItem',
      sorter: (a, b) => a.nomeItem.localeCompare(b.nomeItem, 'pt-BR'),
      render: (nome: string) => <Typography.Text strong>{nome}</Typography.Text>,
    },
    {
      title: 'Categoria',
      dataIndex: 'categoria',
      key: 'categoria',
      render: (categoria: CategoriaItem) => <TagCategoria categoria={categoria} />,
    },
    {
      title: 'Em estoque',
      key: 'quantidade',
      sorter: (a, b) => a.quantidadeAtual - b.quantidadeAtual,
      render: (_, item) => {
        const atual = situacao(item)
        return (
          <div style={{ minWidth: 140 }}>
            <Flex align="baseline" gap={6}>
              <Typography.Text strong style={{ fontSize: 16 }}>
                {item.quantidadeAtual}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {item.quantidadeMinima > 0 ? `mín. ${item.quantidadeMinima}` : 'sem mínimo'}
              </Typography.Text>
            </Flex>
            {item.quantidadeMinima > 0 && (
              // Barra cheia = o dobro do mínimo.
              <Progress
                percent={Math.min(100, (item.quantidadeAtual / (item.quantidadeMinima * 2)) * 100)}
                showInfo={false}
                size="small"
                strokeColor={coresSituacao[atual]}
                style={{ margin: 0 }}
              />
            )}
          </div>
        )
      },
    },
    {
      title: 'Situação',
      key: 'situacao',
      render: (_, item) => {
        const atual = situacao(item)
        return <Tag color={coresSituacao[atual]}>{rotulosSituacao[atual]}</Tag>
      },
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: ehAdmin ? 184 : 64,
      render: (_, item) => {
        const comMovimentacoes = temMovimentacoes(item)
        return (
          <Flex gap={4}>
            <Tooltip title="Registrar doação">
              <Button
                type="text"
                icon={<GiftOutlined />}
                aria-label={`Registrar doação de ${item.nomeItem}`}
                onClick={() => setModal({ tipo: 'doacao', doacao: null, itemId: item.id })}
              />
            </Tooltip>
            {ehAdmin && (
              <>
                <Tooltip title={item.quantidadeAtual === 0 ? 'Sem estoque para saída' : 'Registrar saída'}>
                  <Button
                    type="text"
                    icon={<ExportOutlined />}
                    aria-label={`Registrar saída de ${item.nomeItem}`}
                    disabled={item.quantidadeAtual === 0}
                    onClick={() => setModal({ tipo: 'saida', saida: null, itemId: item.id })}
                  />
                </Tooltip>
                <Tooltip title="Editar">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    aria-label={`Editar ${item.nomeItem}`}
                    onClick={() => setModal({ tipo: 'item', item })}
                  />
                </Tooltip>
                <Popconfirm
                  title="Excluir este item?"
                  okText="Excluir"
                  cancelText="Cancelar"
                  okButtonProps={{ danger: true }}
                  disabled={comMovimentacoes}
                  onConfirm={() => removerItem(item)}
                >
                  <Tooltip
                    title={comMovimentacoes ? 'Itens com doações ou saídas registradas não podem ser excluídos' : 'Excluir'}
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      aria-label={`Excluir ${item.nomeItem}`}
                      disabled={comMovimentacoes}
                      loading={excluindoId === item.id}
                    />
                  </Tooltip>
                </Popconfirm>
              </>
            )}
          </Flex>
        )
      },
    },
  ]

  const colunasDoacoes: TableColumnsType<Doacao> = [
    {
      title: 'Data',
      dataIndex: 'dataEntrada',
      key: 'dataEntrada',
      width: 120,
      sorter: (a, b) => ordenarPorData(a.dataEntrada, b.dataEntrada),
      render: (data: string) => formatarData(data),
    },
    {
      title: 'Item',
      key: 'item',
      render: (_, doacao) => (
        <Flex align="center" gap={8} wrap>
          <Typography.Text strong>{doacao.item?.nomeItem ?? '-'}</Typography.Text>
          <TagCategoria categoria={doacao.item?.categoria} />
        </Flex>
      ),
    },
    {
      title: 'Quantidade',
      dataIndex: 'quantidade',
      key: 'quantidade',
      sorter: (a, b) => a.quantidade - b.quantidade,
      render: (quantidade: number) => (
        <Typography.Text strong style={{ color: cores.sucesso }}>
          +{quantidade}
        </Typography.Text>
      ),
    },
    {
      title: 'Doador',
      dataIndex: 'doador',
      key: 'doador',
      render: (doador: string) =>
        doador === 'Anônimo' ? <Typography.Text type="secondary">Anônimo</Typography.Text> : doador || '-',
    },
    {
      title: 'Registrado por',
      key: 'usuario',
      render: (_, doacao) => doacao.usuario?.nome ?? '-',
    },
    ...(ehAdmin
      ? [
          {
            title: 'Ações',
            key: 'acoes',
            width: 104,
            render: (_: unknown, doacao: Doacao) => (
              <Flex gap={4}>
                <Tooltip title="Editar">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    aria-label="Editar doação"
                    onClick={() => setModal({ tipo: 'doacao', doacao })}
                  />
                </Tooltip>
                <Popconfirm
                  title="Excluir esta doação?"
                  description={`${doacao.quantidade} unidade(s) serão retiradas do estoque.`}
                  okText="Excluir"
                  cancelText="Cancelar"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => removerDoacao(doacao)}
                >
                  <Tooltip title="Excluir">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      aria-label="Excluir doação"
                      loading={excluindoId === doacao.id}
                    />
                  </Tooltip>
                </Popconfirm>
              </Flex>
            ),
          },
        ]
      : []),
  ]

  const colunasSaidas: TableColumnsType<SaidaEstoque> = [
    {
      title: 'Data',
      dataIndex: 'dataSaida',
      key: 'dataSaida',
      width: 120,
      sorter: (a, b) => ordenarPorData(a.dataSaida, b.dataSaida),
      render: (data: string) => formatarData(data),
    },
    {
      title: 'Item',
      key: 'item',
      render: (_, saida) => (
        <Flex align="center" gap={8} wrap>
          <Typography.Text strong>{saida.item?.nomeItem ?? '-'}</Typography.Text>
          <TagCategoria categoria={saida.item?.categoria} />
        </Flex>
      ),
    },
    {
      title: 'Quantidade',
      dataIndex: 'quantidade',
      key: 'quantidade',
      sorter: (a, b) => a.quantidade - b.quantidade,
      render: (quantidade: number) => (
        <Typography.Text strong style={{ color: cores.laranja }}>
          −{quantidade}
        </Typography.Text>
      ),
    },
    {
      title: 'Finalidade',
      dataIndex: 'finalidade',
      key: 'finalidade',
    },
    {
      title: 'Registrado por',
      key: 'usuario',
      render: (_, saida) => saida.usuario?.nome ?? '-',
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 104,
      render: (_, saida) => (
        <Flex gap={4}>
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined />}
              aria-label="Editar saída"
              onClick={() => setModal({ tipo: 'saida', saida })}
            />
          </Tooltip>
          <Popconfirm
            title="Excluir esta saída?"
            description={`${saida.quantidade} unidade(s) voltarão ao estoque.`}
            okText="Excluir"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
            onConfirm={() => removerSaida(saida)}
          >
            <Tooltip title="Excluir">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                aria-label="Excluir saída"
                loading={excluindoId === saida.id}
              />
            </Tooltip>
          </Popconfirm>
        </Flex>
      ),
    },
  ]

  const paginacao = (atual: number, aoMudar: (pagina: number) => void) => ({
    current: atual,
    pageSize: TAMANHO_PAGINA,
    showSizeChanger: false,
    hideOnSinglePage: true,
    onChange: aoMudar,
  })

  const abaEstoque = (
    <Flex vertical gap={16}>
      <Flex wrap gap={12}>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: cores.textoSecundario }} />}
          placeholder="Buscar item"
          aria-label="Buscar item"
          value={buscaItem}
          onChange={(e) => {
            setBuscaItem(e.target.value)
            setPaginaItens(1)
          }}
          style={{ flex: '1 1 240px', maxWidth: 400 }}
        />
        <Select
          aria-label="Filtrar por categoria"
          value={filtroCategoria}
          onChange={(valor) => {
            setFiltroCategoria(valor)
            setPaginaItens(1)
          }}
          options={[{ value: TODOS, label: 'Todas as categorias' }, ...opcoesCategoria]}
          style={{ flex: '0 1 200px', minWidth: 160 }}
        />
        <Select
          aria-label="Filtrar por situação"
          value={filtroSituacao}
          onChange={(valor) => {
            setFiltroSituacao(valor)
            setPaginaItens(1)
          }}
          options={[
            { value: TODOS, label: 'Todas as situações' },
            { value: 'BAIXO', label: rotulosSituacao.BAIXO },
            { value: 'ESGOTADO', label: rotulosSituacao.ESGOTADO },
            { value: 'OK', label: rotulosSituacao.OK },
          ]}
          style={{ flex: '0 1 200px', minWidth: 160 }}
        />
      </Flex>
      <Table<ItemEstoque>
        rowKey="id"
        columns={colunasItens}
        dataSource={itensFiltrados}
        loading={carregando}
        locale={{
          emptyText:
            itens.length === 0
              ? ehAdmin
                ? 'Nenhum item cadastrado. Use "Cadastrar item" para começar.'
                : 'Nenhum item cadastrado.'
              : 'Nenhum item encontrado.',
        }}
        scroll={{ x: 'max-content' }}
        pagination={paginacao(paginaItens, setPaginaItens)}
      />
    </Flex>
  )

  const abaDoacoes = (
    <Flex vertical gap={16}>
      <Input
        allowClear
        prefix={<SearchOutlined style={{ color: cores.textoSecundario }} />}
        placeholder="Buscar por doador ou item"
        aria-label="Buscar por doador ou item"
        value={buscaDoacao}
        onChange={(e) => {
          setBuscaDoacao(e.target.value)
          setPaginaDoacoes(1)
        }}
        style={{ maxWidth: 400 }}
      />
      <Table<Doacao>
        rowKey="id"
        columns={colunasDoacoes}
        dataSource={doacoesFiltradas}
        loading={carregando}
        locale={{ emptyText: doacoes.length === 0 ? 'Nenhuma doação registrada.' : 'Nenhuma doação encontrada.' }}
        scroll={{ x: 'max-content' }}
        pagination={paginacao(paginaDoacoes, setPaginaDoacoes)}
      />
    </Flex>
  )

  const abaSaidas = (
    <Flex vertical gap={16}>
      <Input
        allowClear
        prefix={<SearchOutlined style={{ color: cores.textoSecundario }} />}
        placeholder="Buscar por finalidade ou item"
        aria-label="Buscar por finalidade ou item"
        value={buscaSaida}
        onChange={(e) => {
          setBuscaSaida(e.target.value)
          setPaginaSaidas(1)
        }}
        style={{ maxWidth: 400 }}
      />
      <Table<SaidaEstoque>
        rowKey="id"
        columns={colunasSaidas}
        dataSource={saidasFiltradas}
        loading={carregando}
        locale={{ emptyText: saidas.length === 0 ? 'Nenhuma saída registrada.' : 'Nenhuma saída encontrada.' }}
        scroll={{ x: 'max-content' }}
        pagination={paginacao(paginaSaidas, setPaginaSaidas)}
      />
    </Flex>
  )

  const abas = [
    { key: 'estoque', label: `Estoque (${itens.length})`, children: abaEstoque },
    { key: 'doacoes', label: `Doações (${doacoes.length})`, children: abaDoacoes },
    ...(ehAdmin ? [{ key: 'saidas', label: `Saídas (${saidas.length})`, children: abaSaidas }] : []),
  ]

  return (
    <Flex vertical gap={24}>
      <Flex justify="space-between" align="center" wrap gap={16}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          Doações & Estoque
        </Typography.Title>
        <Flex wrap gap={8}>
          {ehAdmin && (
            <>
              <Button size="large" icon={<AppstoreOutlined />} onClick={() => setModal({ tipo: 'item', item: null })}>
                Cadastrar item
              </Button>
              <Button
                size="large"
                icon={<ExportOutlined />}
                disabled={itens.length === 0}
                onClick={() => setModal({ tipo: 'saida', saida: null })}
              >
                Registrar saída
              </Button>
            </>
          )}
          <ConfigProvider theme={{ token: { colorPrimary: cores.laranja } }}>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => setModal({ tipo: 'doacao', doacao: null })}
            >
              Registrar doação
            </Button>
          </ConfigProvider>
        </Flex>
      </Flex>

      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <Indicador titulo="Itens cadastrados" valor={itens.length} icone={<InboxOutlined />} cor={cores.primaria} />
        </Col>
        <Col xs={12} lg={6}>
          <Indicador
            titulo="Estoque baixo"
            valor={itensBaixos.length}
            icone={<WarningOutlined />}
            cor={itensBaixos.length > 0 ? cores.laranja : cores.sucesso}
          />
        </Col>
        <Col xs={12} lg={6}>
          <Indicador titulo="Doações no mês" valor={indicadoresDoMes.doacoes} icone={<GiftOutlined />} cor={cores.teal} />
        </Col>
        <Col xs={12} lg={6}>
          <Indicador
            titulo="Unidades recebidas no mês"
            valor={indicadoresDoMes.unidades}
            icone={<PlusOutlined />}
            cor={cores.sucesso}
          />
        </Col>
      </Row>

      {!carregando && itensBaixos.length > 0 && (
        <Alert
          type="warning"
          showIcon
          title={
            itensBaixos.length === 1
              ? '1 item precisa de reposição'
              : `${itensBaixos.length} itens precisam de reposição`
          }
          description={itensBaixos
            .slice(0, 5)
            .map((item) =>
              item.quantidadeAtual === 0
                ? `${item.nomeItem} (esgotado)`
                : `${item.nomeItem} (${item.quantidadeAtual} de ${item.quantidadeMinima})`,
            )
            .join(' · ')
            .concat(itensBaixos.length > 5 ? ` e mais ${itensBaixos.length - 5}` : '')}
          action={
            <Button size="small" onClick={verItensBaixos}>
              Ver itens
            </Button>
          }
        />
      )}

      <Card styles={{ body: { paddingTop: 8 } }}>
        <Tabs activeKey={aba} onChange={(chave) => setAba(chave as Aba)} items={abas} />
      </Card>

      <ModalItem
        aberto={modal?.tipo === 'item'}
        item={modal?.tipo === 'item' ? modal.item : null}
        onFechar={() => setModal(null)}
        onSalvo={aoSalvarItem}
        onDesatualizado={aoDesatualizar}
      />
      <ModalDoacao
        aberto={modal?.tipo === 'doacao'}
        doacao={modal?.tipo === 'doacao' ? modal.doacao : null}
        itemInicialId={modal?.tipo === 'doacao' ? modal.itemId : undefined}
        itens={itens}
        ehAdmin={ehAdmin}
        onFechar={() => setModal(null)}
        onSalva={aoSalvarDoacao}
        onDesatualizado={aoDesatualizar}
      />
      {ehAdmin && (
        <ModalSaida
          aberto={modal?.tipo === 'saida'}
          saida={modal?.tipo === 'saida' ? modal.saida : null}
          itemInicialId={modal?.tipo === 'saida' ? modal.itemId : undefined}
          itens={itens}
          onFechar={() => setModal(null)}
          onSalva={aoSalvarSaida}
          onDesatualizado={aoDesatualizar}
        />
      )}
    </Flex>
  )
}

export default Doacoes
