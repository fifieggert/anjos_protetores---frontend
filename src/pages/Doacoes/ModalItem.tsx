import { useEffect, useState } from 'react'
import { App, Flex, Form, Input, InputNumber, Modal, Select, Typography } from 'antd'
import { atualizarItem, criarItem } from '../../services/estoque'
import { errosDosCampos, mensagemDeErro, statusDoErro } from '../../utils/erros'
import { CATEGORIAS, rotulosCategoria } from '../../types/estoque'
import type { CategoriaItem, DadosItemEstoque, ItemEstoque } from '../../types/estoque'

// Limite das colunas de texto no banco (VARCHAR(191)).
const MAX_TEXTO = 191

interface CamposItem {
  nomeItem: string
  categoria: CategoriaItem
  quantidadeAtual?: number | null
  quantidadeMinima?: number | null
}

const CAMPOS_FORM: readonly (keyof CamposItem)[] = ['nomeItem', 'categoria', 'quantidadeAtual', 'quantidadeMinima']

const opcoesCategoria = CATEGORIAS.map((valor) => ({ value: valor, label: rotulosCategoria[valor] }))

interface ModalItemProps {
  aberto: boolean
  // null = cadastro
  item: ItemEstoque | null
  onFechar: () => void
  onSalvo: (item: ItemEstoque, novo: boolean) => void
  // O item sumiu do servidor (404): a lista precisa ser recarregada.
  onDesatualizado: () => void
}

function ModalItem({ aberto, item, onFechar, onSalvo, onDesatualizado }: ModalItemProps) {
  const { message } = App.useApp()
  const [form] = Form.useForm<CamposItem>()
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    form.resetFields()
    if (item) {
      form.setFieldsValue({
        nomeItem: item.nomeItem,
        categoria: item.categoria,
        quantidadeMinima: item.quantidadeMinima,
      })
    }
  }, [aberto, item, form])

  async function salvar(valores: CamposItem) {
    setSalvando(true)
    try {
      const corpo: DadosItemEstoque = {
        nomeItem: valores.nomeItem.trim(),
        categoria: valores.categoria,
        quantidadeMinima: valores.quantidadeMinima ?? 0,
      }
      if (item) {
        onSalvo(await atualizarItem(item.id, corpo), false)
        message.success('Item atualizado.')
      } else {
        corpo.quantidadeAtual = valores.quantidadeAtual ?? 0
        onSalvo(await criarItem(corpo), true)
        message.success('Item cadastrado.')
      }
    } catch (e) {
      form.setFields(errosDosCampos(e, CAMPOS_FORM))
      message.error(mensagemDeErro(e, 'Não foi possível salvar o item. Tente novamente.'))
      if (statusDoErro(e) === 404) onDesatualizado()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal
      title={item ? 'Editar item' : 'Cadastrar item'}
      open={aberto}
      onCancel={() => !salvando && onFechar()}
      onOk={() => form.submit()}
      okText={item ? 'Salvar' : 'Cadastrar'}
      cancelText="Cancelar"
      confirmLoading={salvando}
      cancelButtonProps={{ disabled: salvando }}
      mask={{ closable: !salvando }}
      forceRender
    >
      <Form<CamposItem> form={form} layout="vertical" onFinish={salvar} disabled={salvando}>
        <Form.Item
          label="Nome do item"
          name="nomeItem"
          rules={[
            { required: true, whitespace: true, message: 'Informe o nome do item.' },
            { max: MAX_TEXTO, message: `O nome deve ter no máximo ${MAX_TEXTO} caracteres.` },
          ]}
        >
          <Input placeholder="Ex.: Ração para filhotes 15 kg" />
        </Form.Item>

        <Form.Item label="Categoria" name="categoria" rules={[{ required: true, message: 'Selecione a categoria.' }]}>
          <Select placeholder="Selecione" options={opcoesCategoria} />
        </Form.Item>

        <Flex gap={16} wrap>
          {!item && (
            <Form.Item
              label="Quantidade inicial"
              name="quantidadeAtual"
              rules={[{ type: 'integer', min: 0, message: 'Informe um número inteiro a partir de 0.' }]}
              style={{ flex: '1 1 180px' }}
            >
              <InputNumber min={0} precision={0} placeholder="0" style={{ width: '100%' }} />
            </Form.Item>
          )}
          <Form.Item
            label="Quantidade mínima"
            name="quantidadeMinima"
            tooltip="Abaixo dela o item aparece como estoque baixo. Use 0 para não alertar."
            rules={[{ type: 'integer', min: 0, message: 'Informe um número inteiro a partir de 0.' }]}
            style={{ flex: '1 1 180px' }}
          >
            <InputNumber min={0} precision={0} placeholder="0" style={{ width: '100%' }} />
          </Form.Item>
        </Flex>

        {item && (
          <Typography.Text type="secondary">
            A quantidade em estoque ({item.quantidadeAtual}) muda apenas com doações e saídas.
          </Typography.Text>
        )}
      </Form>
    </Modal>
  )
}

export default ModalItem
