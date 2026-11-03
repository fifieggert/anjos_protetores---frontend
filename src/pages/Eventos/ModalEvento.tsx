import { useEffect, useState } from 'react'
import { App, DatePicker, Flex, Form, Input, Modal, TimePicker, Typography } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { atualizarEvento, criarEvento } from '../../services/eventos'
import { cores } from '../../theme/cores'
import { LIMITES_EVENTO } from '../../types/evento'
import type { DadosEvento, Evento } from '../../types/evento'
import { diaDaApi, diaParaApi, diaPassado, FORMATO_DATA } from '../../utils/datas'
import { errosDosCampos, mensagemDeErro, statusDoErro } from '../../utils/erros'
import { urlValida } from '../../utils/texto'

const FORMATO_HORARIO = 'HH:mm'

interface CamposEvento {
  titulo?: string
  descricao?: string
  data?: Dayjs | null
  horarioInicio?: Dayjs | null
  horarioFim?: Dayjs | null
  local?: string
  imagemUrl?: string
}

const CAMPOS_FORM: readonly (keyof CamposEvento)[] = [
  'titulo',
  'descricao',
  'data',
  'horarioInicio',
  'horarioFim',
  'local',
  'imagemUrl',
]

// "HH:mm" -> Dayjs para o TimePicker (o dia não importa).
function horarioDaApi(horario: string | null) {
  const partes = horario ? /^(\d{2}):(\d{2})$/.exec(horario) : null
  return partes ? dayjs().hour(Number(partes[1])).minute(Number(partes[2])).second(0).millisecond(0) : null
}

function horarioParaApi(horario: Dayjs | null | undefined) {
  return horario ? horario.format(FORMATO_HORARIO) : null
}

// Texto opcional: vazio vira null.
function textoOuNulo(valor: string | undefined) {
  const texto = valor?.trim() ?? ''
  return texto === '' ? null : texto
}

// Cadastro: todos os campos, opcionais vazios omitidos. Edição: só o que mudou
// (null limpa um campo opcional que tinha valor).
function montarCorpo(valores: CamposEvento, evento: Evento | null): DadosEvento {
  const novo: Required<DadosEvento> = {
    titulo: valores.titulo?.trim() ?? '',
    descricao: textoOuNulo(valores.descricao),
    data: valores.data ? diaParaApi(valores.data) : '',
    horarioInicio: horarioParaApi(valores.horarioInicio) ?? '',
    horarioFim: horarioParaApi(valores.horarioFim),
    local: valores.local?.trim() ?? '',
    imagemUrl: textoOuNulo(valores.imagemUrl),
  }

  if (!evento) {
    const corpo: DadosEvento = {
      titulo: novo.titulo,
      data: novo.data,
      horarioInicio: novo.horarioInicio,
      local: novo.local,
    }
    if (novo.descricao) corpo.descricao = novo.descricao
    if (novo.horarioFim) corpo.horarioFim = novo.horarioFim
    if (novo.imagemUrl) corpo.imagemUrl = novo.imagemUrl
    return corpo
  }

  const corpo: DadosEvento = {}
  if (novo.titulo !== evento.titulo) corpo.titulo = novo.titulo
  if (novo.descricao !== evento.descricao) corpo.descricao = novo.descricao
  const diaOriginal = diaDaApi(evento.data)
  if (valores.data && !(diaOriginal && valores.data.isSame(diaOriginal, 'day'))) corpo.data = novo.data
  if (novo.horarioInicio !== evento.horarioInicio) corpo.horarioInicio = novo.horarioInicio
  if (novo.horarioFim !== evento.horarioFim) corpo.horarioFim = novo.horarioFim
  if (novo.local !== evento.local) corpo.local = novo.local
  if (novo.imagemUrl !== evento.imagemUrl) corpo.imagemUrl = novo.imagemUrl
  return corpo
}

// Pré-visualização pequena da imagem; some se a URL não carregar.
function PreviaImagem({ url }: { url: string }) {
  const [falhou, setFalhou] = useState(false)

  if (falhou) {
    return (
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Não foi possível carregar a imagem desta URL.
      </Typography.Text>
    )
  }

  return (
    <img
      src={url}
      alt="Pré-visualização da imagem do evento"
      onError={() => setFalhou(true)}
      style={{
        display: 'block',
        width: 160,
        height: 90,
        objectFit: 'cover',
        borderRadius: 8,
        border: `1px solid ${cores.borda}`,
        background: cores.fundoSuave,
      }}
    />
  )
}

interface ModalEventoProps {
  aberto: boolean
  // null = cadastro de novo evento
  evento: Evento | null
  onFechar: () => void
  onSalvo: (evento: Evento, novo: boolean) => void
  onDesatualizado: () => void
}

function ModalEvento({ aberto, evento, onFechar, onSalvo, onDesatualizado }: ModalEventoProps) {
  const { message } = App.useApp()
  const [form] = Form.useForm<CamposEvento>()
  const [salvando, setSalvando] = useState(false)
  const editando = evento !== null

  const imagemUrl = (Form.useWatch('imagemUrl', form) ?? '').trim()
  const previa = imagemUrl.length <= LIMITES_EVENTO.imagemUrlMax && urlValida(imagemUrl) ? imagemUrl : null

  useEffect(() => {
    if (!aberto) return
    form.resetFields()
    if (evento) {
      form.setFieldsValue({
        titulo: evento.titulo,
        descricao: evento.descricao ?? undefined,
        data: diaDaApi(evento.data),
        horarioInicio: horarioDaApi(evento.horarioInicio),
        horarioFim: horarioDaApi(evento.horarioFim),
        local: evento.local,
        imagemUrl: evento.imagemUrl ?? undefined,
      })
    }
  }, [aberto, evento, form])

  async function salvar(valores: CamposEvento) {
    const corpo = montarCorpo(valores, evento)

    setSalvando(true)
    try {
      if (evento) {
        if (Object.keys(corpo).length === 0) {
          message.info('Nenhuma alteração para salvar.')
          onFechar()
          return
        }
        onSalvo(await atualizarEvento(evento.id, corpo), false)
        message.success('Evento atualizado.')
      } else {
        onSalvo(await criarEvento(corpo), true)
        message.success('Evento cadastrado. Ele já aparece na página pública.')
      }
    } catch (e) {
      const status = statusDoErro(e)
      message.error(mensagemDeErro(e, 'Não foi possível salvar o evento. Tente novamente.'))
      // 404/409: o evento mudou ou foi excluído por outra pessoa. Fecha e recarrega a lista.
      if (status === 404 || status === 409) {
        onFechar()
        onDesatualizado()
      } else {
        form.setFields(errosDosCampos(e, CAMPOS_FORM))
      }
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal
      title={editando ? 'Editar evento' : 'Novo evento'}
      open={aberto}
      onCancel={() => !salvando && onFechar()}
      onOk={() => form.submit()}
      okText={editando ? 'Salvar' : 'Cadastrar'}
      cancelText="Cancelar"
      confirmLoading={salvando}
      cancelButtonProps={{ disabled: salvando }}
      mask={{ closable: !salvando }}
      width={600}
      forceRender
    >
      <Form<CamposEvento> form={form} layout="vertical" onFinish={salvar} disabled={salvando}>
        <Form.Item
          label="Título"
          name="titulo"
          rules={[
            { required: true, whitespace: true, message: 'Informe o título.' },
            {
              validator: (_, valor?: string) => {
                const tamanho = valor?.trim().length ?? 0
                if (tamanho === 0 || tamanho >= LIMITES_EVENTO.tituloMin) return Promise.resolve()
                return Promise.reject(new Error(`O título deve ter no mínimo ${LIMITES_EVENTO.tituloMin} caracteres.`))
              },
            },
            {
              max: LIMITES_EVENTO.tituloMax,
              message: `O título deve ter no máximo ${LIMITES_EVENTO.tituloMax} caracteres.`,
            },
          ]}
        >
          <Input placeholder="Ex.: Feira de adoção no parque" maxLength={LIMITES_EVENTO.tituloMax} />
        </Form.Item>

        <Form.Item
          label="Descrição"
          name="descricao"
          extra="Opcional. Conte o que vai acontecer e o que levar."
          rules={[
            {
              max: LIMITES_EVENTO.descricaoMax,
              message: `A descrição deve ter no máximo ${LIMITES_EVENTO.descricaoMax} caracteres.`,
            },
          ]}
        >
          <Input.TextArea
            rows={3}
            maxLength={LIMITES_EVENTO.descricaoMax}
            showCount
            placeholder="Ex.: Venha conhecer os animais disponíveis para adoção."
          />
        </Form.Item>

        <Flex gap={16} wrap>
          <Form.Item
            label="Data"
            name="data"
            rules={[{ required: true, message: 'Informe a data.' }]}
            style={{ flex: '1 1 160px' }}
          >
            <DatePicker
              format={FORMATO_DATA}
              disabledDate={editando ? undefined : diaPassado}
              placeholder="dd/mm/aaaa"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            label="Início"
            name="horarioInicio"
            rules={[{ required: true, message: 'Informe o horário de início.' }]}
            style={{ flex: '1 1 120px' }}
          >
            <TimePicker
              format={FORMATO_HORARIO}
              needConfirm={false}
              placeholder="hh:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            label="Término"
            name="horarioFim"
            dependencies={['horarioInicio']}
            extra="Opcional."
            rules={[
              ({ getFieldValue }) => ({
                validator: (_, valor?: Dayjs | null) => {
                  const inicio = horarioParaApi(getFieldValue('horarioInicio'))
                  const fim = horarioParaApi(valor)
                  // "HH:mm": comparar o texto equivale a comparar o horário
                  return !fim || !inicio || fim > inicio
                    ? Promise.resolve()
                    : Promise.reject(new Error('O término deve ser depois do início.'))
                },
              }),
            ]}
            style={{ flex: '1 1 120px' }}
          >
            <TimePicker
              format={FORMATO_HORARIO}
              needConfirm={false}
              placeholder="hh:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Flex>

        <Form.Item
          label="Local"
          name="local"
          rules={[
            { required: true, whitespace: true, message: 'Informe o local.' },
            {
              validator: (_, valor?: string) => {
                const tamanho = valor?.trim().length ?? 0
                if (tamanho === 0 || tamanho >= LIMITES_EVENTO.localMin) return Promise.resolve()
                return Promise.reject(new Error(`O local deve ter no mínimo ${LIMITES_EVENTO.localMin} caracteres.`))
              },
            },
            { max: LIMITES_EVENTO.localMax, message: `O local deve ter no máximo ${LIMITES_EVENTO.localMax} caracteres.` },
          ]}
        >
          <Input placeholder="Ex.: Praça central, em frente à igreja" maxLength={LIMITES_EVENTO.localMax} />
        </Form.Item>

        <Form.Item
          label="URL da imagem"
          name="imagemUrl"
          extra="Opcional. Link de uma imagem já publicada (começando com http:// ou https://)."
          rules={[
            {
              max: LIMITES_EVENTO.imagemUrlMax,
              message: `A URL deve ter no máximo ${LIMITES_EVENTO.imagemUrlMax} caracteres.`,
            },
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

        {/* key: uma URL nova tenta carregar de novo, mesmo depois de uma que falhou */}
        {previa && <PreviaImagem key={previa} url={previa} />}
      </Form>
    </Modal>
  )
}

export default ModalEvento
