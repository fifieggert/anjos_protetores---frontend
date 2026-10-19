import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  App,
  Avatar,
  Button,
  ConfigProvider,
  DatePicker,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { TableColumnsType } from 'antd'
import {
  CheckCircleFilled,
  DeleteOutlined,
  EditOutlined,
  HeartOutlined,
  ManOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  WomanOutlined,
} from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import { useAuth } from '../../contexts/AuthContext'
import { atualizarAnimal, criarAnimal, excluirAnimal, listarAnimais } from '../../services/animais'
import { cores, comOpacidade } from '../../theme/cores'
import { errosDosCampos, mensagemDeErro, statusDoErro } from '../../utils/erros'
import { diaDaApi, diaFuturo, diaParaApi, formatarDia, FORMATO_DATA } from '../../utils/datas'
import { normalizar, rotulo } from '../../utils/texto'
import {
  ESPECIES,
  PORTES,
  SEXOS,
  STATUS_ANIMAL,
  STATUS_EDITAVEIS,
  rotulosEspecie,
  rotulosPorte,
  rotulosSexo,
  rotulosStatusAnimal,
} from '../../types/animal'
import type { Animal, DadosAnimal, Especie, Porte, Sexo, StatusAnimal, StatusEditavel } from '../../types/animal'

// Limite das colunas de texto no banco (VARCHAR(191)).
const MAX_TEXTO = 191

const TODOS = 'TODOS'

const coresStatus: Record<StatusAnimal, string> = {
  DISPONIVEL: cores.sucesso,
  EM_TRATAMENTO: cores.primaria,
  EM_ESPERA: cores.laranja,
  ADOTADO: cores.teal,
}

interface CamposAnimal {
  nome: string
  especie: Especie
  porte: Porte
  raca?: string
  idade?: number | null
  // Na edição de um animal reservado, mostra EM_ESPERA (campo desabilitado, nunca enviado).
  status?: StatusAnimal
  fotoUrl?: string
  descricao?: string
  sexo?: Sexo
  castrado: boolean
  dataCastracao?: Dayjs | null
  vacinado: boolean
  dosesVacina?: number | null
  dataRevacinacao?: Dayjs | null
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
  'sexo',
  'castrado',
  'dataCastracao',
  'vacinado',
  'dosesVacina',
  'dataRevacinacao',
]

const CAMPOS_OPCIONAIS = ['raca', 'idade', 'fotoUrl', 'descricao', 'sexo', 'dosesVacina'] as const

const VALORES_INICIAIS: Partial<CamposAnimal> = { castrado: false, vacinado: false }

const opcoesEspecie = ESPECIES.map((valor) => ({ value: valor, label: rotulosEspecie[valor] }))
const opcoesPorte = PORTES.map((valor) => ({ value: valor, label: rotulosPorte[valor] }))
const opcoesSexo = SEXOS.map((valor) => ({ value: valor, label: rotulosSexo[valor] }))
// Filtro: todos os status. Formulário: só os que o cadastro/edição podem enviar.
const opcoesStatus = STATUS_ANIMAL.map((valor) => ({ value: valor, label: rotulosStatusAnimal[valor] }))
const opcoesStatusEditavel = STATUS_EDITAVEIS.map((valor) => ({ value: valor, label: rotulosStatusAnimal[valor] }))
const opcaoReservado = [{ value: 'EM_ESPERA', label: rotulosStatusAnimal.EM_ESPERA }]

function ehStatusEditavel(status: StatusAnimal): status is StatusEditavel {
  return (STATUS_EDITAVEIS as readonly StatusAnimal[]).includes(status)
}

// Texto do indicador de vacina na tabela (ex.: "2 doses · revacinação em 01/03/2027").
function detalhesVacina(animal: Animal) {
  const partes: string[] = []
  if (typeof animal.dosesVacina === 'number') {
    partes.push(`${animal.dosesVacina} ${animal.dosesVacina === 1 ? 'dose' : 'doses'}`)
  }
  if (animal.dataRevacinacao) partes.push(`revacinação em ${formatarDia(animal.dataRevacinacao)}`)
  return partes.join(' · ')
}

function urlValida(valor: string) {
  try {
    const url = new URL(valor)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// Data "só dia": enviada quando mudou; null na edição só se o animal tinha data (para limpar).
function dataDoDia(dia: Dayjs | null | undefined, originalIso: string | null | undefined) {
  const original = diaDaApi(originalIso)
  if (!dia) return original ? null : undefined
  return original && dia.isSame(original, 'day') ? undefined : diaParaApi(dia)
}

// Monta o corpo só com os campos aceitos pela API. Opcionais vazios são omitidos
// no cadastro; na edição vão como null apenas se o animal tinha valor (para limpar).
function montarCorpo(valores: CamposAnimal, editando: Animal | null): DadosAnimal {
  const corpo: DadosAnimal = {
    nome: valores.nome.trim(),
    especie: valores.especie,
    porte: valores.porte,
    castrado: valores.castrado,
    vacinado: valores.vacinado,
  }

  // Nunca envia EM_ESPERA nem ADOTADO; o mesmo status atual também é omitido.
  if (valores.status && ehStatusEditavel(valores.status) && valores.status !== editando?.status) {
    corpo.status = valores.status
  }

  // Desligados, castrado/vacinado já fazem o servidor limpar datas e doses: não envia os dependentes.
  if (valores.castrado) {
    const dataCastracao = dataDoDia(valores.dataCastracao, editando?.dataCastracao)
    if (dataCastracao !== undefined) corpo.dataCastracao = dataCastracao
  }
  if (valores.vacinado) {
    const dataRevacinacao = dataDoDia(valores.dataRevacinacao, editando?.dataRevacinacao)
    if (dataRevacinacao !== undefined) corpo.dataRevacinacao = dataRevacinacao
  }

  for (const campo of CAMPOS_OPCIONAIS) {
    if (campo === 'dosesVacina' && !valores.vacinado) continue
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
  const castrado = Form.useWatch('castrado', form)
  const vacinado = Form.useWatch('vacinado', form)

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
    // fora dos initialValues para a edição de um animal adotado começar com o status vazio
    form.setFieldsValue({ status: 'DISPONIVEL' })
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
      // Adotado: o campo começa vazio e só é preenchido para registrar uma devolução.
      status: animal.status === 'ADOTADO' ? undefined : animal.status,
      fotoUrl: animal.fotoUrl ?? undefined,
      descricao: animal.descricao ?? undefined,
      sexo: animal.sexo ?? undefined,
      castrado: animal.castrado ?? false,
      dataCastracao: diaDaApi(animal.dataCastracao),
      vacinado: animal.vacinado ?? false,
      dosesVacina: animal.dosesVacina ?? null,
      dataRevacinacao: diaDaApi(animal.dataRevacinacao),
    })
    setModalAberto(true)
  }

  function fecharModal() {
    if (salvando) return
    setModalAberto(false)
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
      // 400 com "campos": cada mensagem vai para o seu campo; o resto vira mensagem geral.
      const errosCampos = errosDosCampos(e, CAMPOS_FORM)
      form.setFields(errosCampos)
      message.error(
        errosCampos.length > 0
          ? 'Confira os campos destacados.'
          : mensagemDeErro(e, 'Não foi possível salvar o animal. Tente novamente.'),
      )
      // 404: o animal foi excluído. 409: o status mudou por outro caminho (ex.: alguém
      // registrou interesse e ele ficou reservado). Nos dois casos, recarrega a lista.
      const status = statusDoErro(e)
      if (status === 404 || status === 409) {
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
      if (statusDoErro(e) === 404) carregar()
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
      title: 'Sexo',
      dataIndex: 'sexo',
      key: 'sexo',
      render: (sexo?: Sexo | null) =>
        sexo ? (
          <Flex gap={6} align="center">
            {sexo === 'MACHO' ? (
              <ManOutlined aria-hidden style={{ color: cores.primaria }} />
            ) : (
              <WomanOutlined aria-hidden style={{ color: cores.teal }} />
            )}
            {rotulo(rotulosSexo, sexo)}
          </Flex>
        ) : (
          '-'
        ),
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
      title: 'Saúde',
      key: 'saude',
      render: (_, animal) => {
        const vacina = detalhesVacina(animal)
        return (
          <Flex vertical gap={2} style={{ fontSize: 13 }}>
            <Tooltip
              title={animal.castrado && animal.dataCastracao ? `Castrado em ${formatarDia(animal.dataCastracao)}` : undefined}
            >
              <span style={{ color: animal.castrado ? cores.texto : cores.textoSecundario }}>
                {animal.castrado ? (
                  <CheckCircleFilled aria-hidden style={{ color: cores.sucesso, marginRight: 6 }} />
                ) : (
                  <MinusCircleOutlined aria-hidden style={{ marginRight: 6 }} />
                )}
                {animal.castrado ? 'Castrado' : 'Não castrado'}
              </span>
            </Tooltip>
            <Tooltip title={animal.vacinado && vacina ? vacina : undefined}>
              <span style={{ color: animal.vacinado ? cores.texto : cores.textoSecundario }}>
                {animal.vacinado ? (
                  <CheckCircleFilled aria-hidden style={{ color: cores.sucesso, marginRight: 6 }} />
                ) : (
                  <MinusCircleOutlined aria-hidden style={{ marginRight: 6 }} />
                )}
                {animal.vacinado ? 'Vacinado' : 'Não vacinado'}
              </span>
            </Tooltip>
          </Flex>
        )
      },
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
        <Form<CamposAnimal>
          form={form}
          layout="vertical"
          onFinish={salvar}
          disabled={salvando}
          initialValues={VALORES_INICIAIS}
        >
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

          {editando?.status === 'EM_ESPERA' ? (
            <Form.Item
              label="Status"
              name="status"
              extra="Animal reservado: conclua ou cancele o interesse na tela de Adoções."
            >
              <Select disabled options={opcaoReservado} />
            </Form.Item>
          ) : editando?.status === 'ADOTADO' ? (
            <>
              <Alert
                type="warning"
                showIcon
                title="Animal adotado. Use isto só para registrar uma devolução."
                style={{ marginBottom: 16 }}
              />
              <Form.Item label="Status" name="status">
                <Select allowClear placeholder="Adotado (sem alteração)" options={opcoesStatusEditavel} />
              </Form.Item>
            </>
          ) : (
            <Form.Item label="Status" name="status" rules={[{ required: true, message: 'Selecione o status.' }]}>
              <Select options={opcoesStatusEditavel} />
            </Form.Item>
          )}

          <Form.Item label="Sexo" name="sexo">
            <Select allowClear placeholder="Não informado" options={opcoesSexo} />
          </Form.Item>

          <Flex gap={16} wrap>
            <Form.Item label="Castrado" name="castrado" valuePropName="checked" style={{ flex: '0 0 auto' }}>
              <Switch
                checkedChildren="Sim"
                unCheckedChildren="Não"
                onChange={(ligado) => {
                  if (!ligado) form.setFieldsValue({ dataCastracao: null })
                }}
              />
            </Form.Item>
            {castrado && (
              <Form.Item label="Data da castração" name="dataCastracao" style={{ flex: '1 1 180px' }}>
                <DatePicker
                  format={FORMATO_DATA}
                  disabledDate={diaFuturo}
                  placeholder="Opcional"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            )}
          </Flex>

          <Flex gap={16} wrap>
            <Form.Item label="Vacinado" name="vacinado" valuePropName="checked" style={{ flex: '0 0 auto' }}>
              <Switch
                checkedChildren="Sim"
                unCheckedChildren="Não"
                onChange={(ligado) => {
                  if (!ligado) form.setFieldsValue({ dosesVacina: null, dataRevacinacao: null })
                }}
              />
            </Form.Item>
            {vacinado && (
              <>
                <Form.Item
                  label="Doses"
                  name="dosesVacina"
                  rules={[
                    { type: 'integer', message: 'As doses devem ser um número inteiro.' },
                    { type: 'number', min: 0, max: 100, message: 'Informe de 0 a 100 doses.' },
                  ]}
                  style={{ flex: '1 1 100px' }}
                >
                  <InputNumber min={0} max={100} precision={0} placeholder="Opcional" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Revacinação" name="dataRevacinacao" style={{ flex: '1 1 160px' }}>
                  <DatePicker format={FORMATO_DATA} placeholder="Opcional" style={{ width: '100%' }} />
                </Form.Item>
              </>
            )}
          </Flex>

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
