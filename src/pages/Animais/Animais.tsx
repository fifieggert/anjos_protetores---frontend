import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  App,
  Avatar,
  Button,
  ConfigProvider,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { TableColumnsType } from 'antd'
import { DeleteOutlined, EditOutlined, HeartOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'
import { atualizarAnimal, criarAnimal, excluirAnimal, listarAnimais } from '../../services/animais'
import { cores, comOpacidade } from '../../theme/cores'
import {
  ESPECIES,
  PORTES,
  STATUS_ANIMAL,
  rotulosEspecie,
  rotulosPorte,
  rotulosStatusAnimal,
} from '../../types/animal'
import type { Animal, DadosAnimal, Especie, Porte, StatusAnimal } from '../../types/animal'

// Limite das colunas de texto no banco (VARCHAR(191)).
const MAX_TEXTO = 191

const TODOS = 'TODOS'

const coresStatus: Record<StatusAnimal, string> = {
  DISPONIVEL: cores.sucesso,
  EM_TRATAMENTO: cores.primaria,
  ADOTADO: cores.textoSecundario,
}

interface CamposAnimal {
  nome: string
  especie: Especie
  porte: Porte
  raca?: string
  idade?: number | null
  status?: StatusAnimal
  fotoUrl?: string
  descricao?: string
}

const CAMPOS_FORM: readonly (keyof CamposAnimal)[] = [
  'nome',
  'especie',
  'porte',
  'raca',
  'idade',
  'status',
  'fotoUrl',
  'descricao',
]

const CAMPOS_OPCIONAIS = ['raca', 'idade', 'fotoUrl', 'descricao'] as const

const opcoesEspecie = ESPECIES.map((valor) => ({ value: valor, label: rotulosEspecie[valor] }))
const opcoesPorte = PORTES.map((valor) => ({ value: valor, label: rotulosPorte[valor] }))
const opcoesStatus = STATUS_ANIMAL.map((valor) => ({ value: valor, label: rotulosStatusAnimal[valor] }))

// Rótulo em português; se a API mandar um valor novo, mostra o próprio valor.
function rotulo<T extends string>(rotulos: Record<T, string>, valor: T | null | undefined) {
  if (!valor) return '-'
  return rotulos[valor] ?? valor
}

// Minúsculas e sem acento, para a busca local.
function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function dadosDoErro(erro: unknown) {
  if (!axios.isAxiosError(erro)) return null
  const data: unknown = erro.response?.data
  return data && typeof data === 'object' ? (data as { error?: unknown; campos?: unknown }) : null
}

function mensagemDeErro(erro: unknown, generica: string) {
  if (axios.isAxiosError(erro) && !erro.response) {
    return 'Não foi possível conectar ao servidor. Tente novamente.'
  }
  const mensagem = dadosDoErro(erro)?.error
  return typeof mensagem === 'string' && mensagem.trim() !== '' ? mensagem : generica
}

function urlValida(valor: string) {
  try {
    const url = new URL(valor)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// Monta o corpo só com os campos aceitos pela API. Opcionais vazios são omitidos
// no cadastro; na edição vão como null apenas se o animal tinha valor (para limpar).
function montarCorpo(valores: CamposAnimal, editando: Animal | null): DadosAnimal {
  const corpo: DadosAnimal = {
    nome: valores.nome.trim(),
    especie: valores.especie,
    porte: valores.porte,
  }
  if (editando && valores.status) corpo.status = valores.status

  for (const campo of CAMPOS_OPCIONAIS) {
    const bruto = valores[campo]
    const valor = typeof bruto === 'string' ? bruto.trim() : bruto
    const vazio = valor === undefined || valor === null || valor === ''

    if (!vazio) {
      Object.assign(corpo, { [campo]: valor })
    } else if (editando && editando[campo] !== undefined && editando[campo] !== null && editando[campo] !== '') {
      Object.assign(corpo, { [campo]: null })
    }
  }
  return corpo
}

function Animais() {
  const { message } = App.useApp()
  const { usuario } = useAuth()
  const ehAdmin = usuario?.perfil === 'ADMIN'
  const [form] = Form.useForm<CamposAnimal>()

  const [animais, setAnimais] = useState<Animal[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroEspecie, setFiltroEspecie] = useState<Especie | typeof TODOS>(TODOS)
  const [filtroStatus, setFiltroStatus] = useState<StatusAnimal | typeof TODOS>(TODOS)
  const [pagina, setPagina] = useState(1)

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Animal | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  // Incrementar a versão refaz a busca da lista.
  const [versaoLista, setVersaoLista] = useState(0)

  const carregar = useCallback(() => {
    setCarregando(true)
    setVersaoLista((versao) => versao + 1)
  }, [])

  useEffect(() => {
    let ativo = true
    listarAnimais()
      .then((lista) => {
        if (ativo) setAnimais(Array.isArray(lista) ? lista : [])
      })
      .catch((e: unknown) => {
        if (ativo) message.error(mensagemDeErro(e, 'Não foi possível carregar os animais.'))
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [versaoLista, message])

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim())
    return animais.filter((animal) => {
      if (filtroEspecie !== TODOS && animal.especie !== filtroEspecie) return false
      if (filtroStatus !== TODOS && animal.status !== filtroStatus) return false
      if (!termo) return true
      return normalizar(`${animal.nome ?? ''} ${animal.raca ?? ''}`).includes(termo)
    })
  }, [animais, busca, filtroEspecie, filtroStatus])

  function abrirCadastro() {
    setEditando(null)
    form.resetFields()
    setModalAberto(true)
  }

  function abrirEdicao(animal: Animal) {
    setEditando(animal)
    form.resetFields()
    form.setFieldsValue({
      nome: animal.nome,
      especie: animal.especie,
      porte: animal.porte,
      raca: animal.raca ?? undefined,
      idade: animal.idade ?? null,
      status: animal.status,
      fotoUrl: animal.fotoUrl ?? undefined,
      descricao: animal.descricao ?? undefined,
    })
    setModalAberto(true)
  }

  function fecharModal() {
    if (salvando) return
    setModalAberto(false)
  }

  // 400 com "campos": mostra cada mensagem no campo correspondente do formulário.
  function aplicarErrosDosCampos(erro: unknown) {
    if (!axios.isAxiosError(erro) || erro.response?.status !== 400) return
    const campos = dadosDoErro(erro)?.campos
    if (!campos || typeof campos !== 'object') return

    const doFormulario = Object.entries(campos as Record<string, unknown>).filter(
      ([campo, msg]) => CAMPOS_FORM.includes(campo as keyof CamposAnimal) && typeof msg === 'string',
    )
    form.setFields(
      doFormulario.map(([campo, msg]) => ({ name: campo as keyof CamposAnimal, errors: [msg as string] })),
    )
  }

  async function salvar(valores: CamposAnimal) {
    setSalvando(true)
    try {
      const corpo = montarCorpo(valores, editando)
      if (editando) {
        const atualizado = await atualizarAnimal(editando.id, corpo)
        setAnimais((lista) => lista.map((animal) => (animal.id === editando.id ? atualizado : animal)))
        message.success('Animal atualizado.')
      } else {
        const novo = await criarAnimal(corpo)
        setAnimais((lista) => [novo, ...lista])
        message.success('Animal cadastrado.')
      }
      setModalAberto(false)
    } catch (e) {
      aplicarErrosDosCampos(e)
      message.error(mensagemDeErro(e, 'Não foi possível salvar o animal. Tente novamente.'))
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        setModalAberto(false)
        carregar()
      }
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(animal: Animal) {
    setExcluindoId(animal.id)
    try {
      await excluirAnimal(animal.id)
      setAnimais((lista) => lista.filter((item) => item.id !== animal.id))
      message.success('Animal excluído.')
    } catch (e) {
      message.error(mensagemDeErro(e, 'Não foi possível excluir o animal. Tente novamente.'))
      if (axios.isAxiosError(e) && e.response?.status === 404) carregar()
    } finally {
      setExcluindoId(null)
    }
  }

  const colunas: TableColumnsType<Animal> = [
    {
      title: 'Foto',
      key: 'foto',
      width: 72,
      render: (_, animal) => (
        <Avatar
          size={44}
          src={animal.fotoUrl || undefined}
          alt={animal.nome}
          icon={<HeartOutlined />}
          style={{ color: cores.teal, background: comOpacidade(cores.teal, 0.15) }}
        />
      ),
    },
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
      render: (nome: string) => <Typography.Text strong>{nome}</Typography.Text>,
    },
    {
      title: 'Espécie',
      dataIndex: 'especie',
      key: 'especie',
      render: (especie: Especie) => rotulo(rotulosEspecie, especie),
    },
    {
      title: 'Raça',
      dataIndex: 'raca',
      key: 'raca',
      render: (raca?: string | null) => raca || '-',
    },
    {
      title: 'Idade',
      dataIndex: 'idade',
      key: 'idade',
      render: (idade?: number | null) =>
        typeof idade === 'number' ? `${idade} ${idade === 1 ? 'ano' : 'anos'}` : '-',
    },
    {
      title: 'Porte',
      dataIndex: 'porte',
      key: 'porte',
      render: (porte: Porte) => rotulo(rotulosPorte, porte),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: StatusAnimal) => (
        <Tag color={coresStatus[status] ?? cores.textoSecundario}>{rotulo(rotulosStatusAnimal, status)}</Tag>
      ),
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: ehAdmin ? 104 : 64,
      render: (_, animal) => (
        <Flex gap={4}>
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined />}
              aria-label={`Editar ${animal.nome}`}
              onClick={() => abrirEdicao(animal)}
            />
          </Tooltip>
          {ehAdmin && (
            <Popconfirm
              title="Excluir este animal?"
              okText="Excluir"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
              onConfirm={() => excluir(animal)}
            >
              <Tooltip title="Excluir">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={`Excluir ${animal.nome}`}
                  loading={excluindoId === animal.id}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Flex>
      ),
    },
  ]

  return (
    <Flex vertical gap={24}>
      <Flex justify="space-between" align="center" wrap gap={16}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          Animais
        </Typography.Title>
        <ConfigProvider theme={{ token: { colorPrimary: cores.laranja } }}>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={abrirCadastro}>
            Cadastrar animal
          </Button>
        </ConfigProvider>
      </Flex>

      <Flex wrap gap={12}>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: cores.textoSecundario }} />}
          placeholder="Buscar por nome ou raça"
          aria-label="Buscar por nome ou raça"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value)
            setPagina(1)
          }}
          style={{ flex: '1 1 260px', maxWidth: 400 }}
        />
        <Select
          aria-label="Filtrar por espécie"
          value={filtroEspecie}
          onChange={(valor) => {
            setFiltroEspecie(valor)
            setPagina(1)
          }}
          options={[{ value: TODOS, label: 'Todas as espécies' }, ...opcoesEspecie]}
          style={{ flex: '0 1 200px', minWidth: 160 }}
        />
        <Select
          aria-label="Filtrar por status"
          value={filtroStatus}
          onChange={(valor) => {
            setFiltroStatus(valor)
            setPagina(1)
          }}
          options={[{ value: TODOS, label: 'Todos os status' }, ...opcoesStatus]}
          style={{ flex: '0 1 200px', minWidth: 160 }}
        />
      </Flex>

      <Table<Animal>
        rowKey="id"
        columns={colunas}
        dataSource={filtrados}
        loading={carregando}
        locale={{ emptyText: 'Nenhum animal encontrado.' }}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: pagina,
          pageSize: 10,
          showSizeChanger: false,
          hideOnSinglePage: true,
          onChange: setPagina,
        }}
      />

      <Modal
        title={editando ? 'Editar animal' : 'Cadastrar animal'}
        open={modalAberto}
        onCancel={fecharModal}
        onOk={() => form.submit()}
        okText={editando ? 'Salvar' : 'Cadastrar'}
        cancelText="Cancelar"
        confirmLoading={salvando}
        cancelButtonProps={{ disabled: salvando }}
        maskClosable={!salvando}
        forceRender
      >
        <Form<CamposAnimal> form={form} layout="vertical" onFinish={salvar} disabled={salvando}>
          <Form.Item
            label="Nome"
            name="nome"
            rules={[
              { required: true, whitespace: true, message: 'Informe o nome.' },
              { max: MAX_TEXTO, message: `O nome deve ter no máximo ${MAX_TEXTO} caracteres.` },
            ]}
          >
            <Input placeholder="Ex.: Thor" />
          </Form.Item>

          <Flex gap={16} wrap>
            <Form.Item
              label="Espécie"
              name="especie"
              rules={[{ required: true, message: 'Selecione a espécie.' }]}
              style={{ flex: '1 1 180px' }}
            >
              <Select placeholder="Selecione" options={opcoesEspecie} />
            </Form.Item>
            <Form.Item
              label="Porte"
              name="porte"
              rules={[{ required: true, message: 'Selecione o porte.' }]}
              style={{ flex: '1 1 180px' }}
            >
              <Select placeholder="Selecione" options={opcoesPorte} />
            </Form.Item>
          </Flex>

          <Flex gap={16} wrap>
            <Form.Item
              label="Raça"
              name="raca"
              rules={[{ max: MAX_TEXTO, message: `A raça deve ter no máximo ${MAX_TEXTO} caracteres.` }]}
              style={{ flex: '1 1 180px' }}
            >
              <Input placeholder="Ex.: SRD" />
            </Form.Item>
            <Form.Item
              label="Idade (anos)"
              name="idade"
              rules={[
                { type: 'integer', message: 'A idade deve ser um número inteiro.' },
                { type: 'number', min: 0, max: 40, message: 'A idade deve estar entre 0 e 40 anos.' },
              ]}
              style={{ flex: '1 1 180px' }}
            >
              <InputNumber min={0} max={40} precision={0} placeholder="0 a 40" style={{ width: '100%' }} />
            </Form.Item>
          </Flex>

          {editando && (
            <Form.Item label="Status" name="status" rules={[{ required: true, message: 'Selecione o status.' }]}>
              <Select options={opcoesStatus} />
            </Form.Item>
          )}

          <Form.Item
            label="URL da foto"
            name="fotoUrl"
            rules={[
              { max: MAX_TEXTO, message: `A URL deve ter no máximo ${MAX_TEXTO} caracteres.` },
              {
                validator: (_, valor?: string) =>
                  !valor || !valor.trim() || urlValida(valor.trim())
                    ? Promise.resolve()
                    : Promise.reject(new Error('Informe uma URL válida começando com http:// ou https://.')),
              },
            ]}
          >
            <Input placeholder="https://..." inputMode="url" />
          </Form.Item>

          <Form.Item
            label="Descrição"
            name="descricao"
            rules={[{ max: MAX_TEXTO, message: `A descrição deve ter no máximo ${MAX_TEXTO} caracteres.` }]}
          >
            <Input.TextArea rows={3} maxLength={MAX_TEXTO} showCount placeholder="Temperamento, cuidados, histórico..." />
          </Form.Item>
        </Form>
      </Modal>
    </Flex>
  )
}

export default Animais
