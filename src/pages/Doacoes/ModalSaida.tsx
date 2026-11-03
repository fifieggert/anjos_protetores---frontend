import { useEffect, useMemo, useState } from 'react'
import { App, DatePicker, Flex, Form, Input, InputNumber, Modal, Select, Typography } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { atualizarSaida, criarSaida } from '../../services/estoque'
import { errosDosCampos, mensagemDeErro, statusDoErro } from '../../utils/erros'
import { dataDaEdicao, dataDoCadastro, diaFuturo, FORMATO_DATA } from '../../utils/datas'
import type { DadosSaida, ItemEstoque, SaidaEstoque } from '../../types/estoque'
import { filtrarOpcaoItem, opcoesItens } from './opcoesItens'

const MAX_TEXTO = 191

interface CamposSaida {
  itemId?: string
  quantidade?: number | null
  finalidade?: string
  dataSaida?: Dayjs | null
}

const CAMPOS_FORM: readonly (keyof CamposSaida)[] = ['itemId', 'quantidade', 'finalidade', 'dataSaida']

interface ModalSaidaProps {
  aberto: boolean
  // null = registro de nova saída
  saida: SaidaEstoque | null
  itens: ItemEstoque[]
  itemInicialId?: string
  onFechar: () => void
  onSalva: (saida: SaidaEstoque, nova: boolean) => void
  onDesatualizado: () => void
}

function ModalSaida({ aberto, saida, itens, itemInicialId, onFechar, onSalva, onDesatualizado }: ModalSaidaProps) {
  const { message } = App.useApp()
  const [form] = Form.useForm<CamposSaida>()
  const [salvando, setSalvando] = useState(false)
  const editando = saida !== null

  const opcoes = useMemo(() => opcoesItens(itens), [itens])
  const itemId = Form.useWatch('itemId', form)
  const disponivel = itens.find((item) => item.id === itemId)?.quantidadeAtual

  useEffect(() => {
    if (!aberto) return
    form.resetFields()
    if (saida) {
      form.setFieldsValue({
        itemId: saida.itemId,
        quantidade: saida.quantidade,
        finalidade: saida.finalidade,
        dataSaida: dayjs(saida.dataSaida),
      })
    } else {
      form.setFieldsValue({ itemId: itemInicialId, dataSaida: dayjs() })
    }
  }, [aberto, saida, itemInicialId, form])

  async function salvar(valores: CamposSaida) {
    const finalidade = valores.finalidade?.trim() ?? ''

    setSalvando(true)
    try {
      if (saida) {
        // Só finalidade e data podem mudar; envia apenas o que mudou.
        const corpo: DadosSaida = {}
        if (finalidade !== saida.finalidade) corpo.finalidade = finalidade
        const dataSaida = dataDaEdicao(valores.dataSaida, saida.dataSaida)
        if (dataSaida) corpo.dataSaida = dataSaida

        if (Object.keys(corpo).length === 0) {
          message.info('Nenhuma alteração para salvar.')
          onFechar()
          return
        }
        onSalva(await atualizarSaida(saida.id, corpo), false)
        message.success('Saída atualizada.')
      } else {
        const corpo: DadosSaida = {
          itemId: valores.itemId,
          quantidade: valores.quantidade ?? undefined,
          finalidade,
        }
        const dataSaida = dataDoCadastro(valores.dataSaida)
        if (dataSaida) corpo.dataSaida = dataSaida

        onSalva(await criarSaida(corpo), true)
        message.success('Saída registrada. O estoque foi atualizado.')
      }
    } catch (e) {
      form.setFields(errosDosCampos(e, CAMPOS_FORM))
      // 409 = estoque insuficiente (outra saída pode ter sido registrada antes).
      if (statusDoErro(e) === 409) form.setFields([{ name: 'quantidade', errors: [mensagemDeErro(e, '')] }])
      message.error(mensagemDeErro(e, 'Não foi possível salvar a saída. Tente novamente.'))
      if (statusDoErro(e) === 404 || statusDoErro(e) === 409) onDesatualizado()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal
      title={editando ? 'Editar saída' : 'Registrar saída'}
      open={aberto}
      onCancel={() => !salvando && onFechar()}
      onOk={() => form.submit()}
      okText={editando ? 'Salvar' : 'Registrar'}
      cancelText="Cancelar"
      confirmLoading={salvando}
      cancelButtonProps={{ disabled: salvando }}
      mask={{ closable: !salvando }}
      forceRender
    >
      <Form<CamposSaida> form={form} layout="vertical" onFinish={salvar} disabled={salvando}>
        <Form.Item label="Item" name="itemId" rules={[{ required: true, message: 'Selecione o item.' }]}>
          <Select
            showSearch={{ filterOption: filtrarOpcaoItem }}
            placeholder="Selecione o item"
            options={opcoes}
            disabled={editando}
            notFoundContent={itens.length === 0 ? 'Nenhum item cadastrado.' : 'Nenhum item encontrado.'}
          />
        </Form.Item>

        <Flex gap={16} wrap>
          <Form.Item
            label="Quantidade"
            name="quantidade"
            dependencies={['itemId']}
            extra={!editando && disponivel !== undefined ? `Disponível: ${disponivel}` : undefined}
            rules={[
              { required: true, message: 'Informe a quantidade.' },
              { type: 'integer', min: 1, message: 'Informe um número inteiro maior que 0.' },
              {
                validator: (_, valor?: number | null) =>
                  editando || typeof valor !== 'number' || disponivel === undefined || valor <= disponivel
                    ? Promise.resolve()
                    : Promise.reject(new Error(`Estoque insuficiente. Disponível: ${disponivel}.`)),
              },
            ]}
            style={{ flex: '1 1 160px' }}
          >
            <InputNumber min={1} precision={0} placeholder="Ex.: 2" disabled={editando} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="Data de saída"
            name="dataSaida"
            rules={[{ required: true, message: 'Informe a data.' }]}
            style={{ flex: '1 1 160px' }}
          >
            <DatePicker format={FORMATO_DATA} disabledDate={diaFuturo} allowClear={false} style={{ width: '100%' }} />
          </Form.Item>
        </Flex>

        <Form.Item
          label="Finalidade"
          name="finalidade"
          rules={[
            { required: true, whitespace: true, message: 'Informe a finalidade.' },
            { max: MAX_TEXTO, message: `A finalidade deve ter no máximo ${MAX_TEXTO} caracteres.` },
          ]}
        >
          <Input placeholder="Ex.: Alimentação do canil 2" />
        </Form.Item>

        {editando && (
          <Typography.Text type="secondary">
            Item e quantidade não podem ser alterados porque o estoque já foi ajustado. Para corrigi-los, exclua a
            saída e registre outra.
          </Typography.Text>
        )}
      </Form>
    </Modal>
  )
}

export default ModalSaida
