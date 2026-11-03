import { useEffect, useMemo, useState } from 'react'
import { App, DatePicker, Flex, Form, Input, InputNumber, Modal, Select, Typography } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { atualizarDoacao, criarDoacao } from '../../services/estoque'
import { errosDosCampos, mensagemDeErro, statusDoErro } from '../../utils/erros'
import { dataDaEdicao, dataDoCadastro, diaFuturo, FORMATO_DATA } from '../../utils/datas'
import type { DadosDoacao, Doacao, ItemEstoque } from '../../types/estoque'
import { filtrarOpcaoItem, opcoesItens } from './opcoesItens'

const MAX_TEXTO = 191

interface CamposDoacao {
  itemId?: string
  quantidade?: number | null
  doador?: string
  dataEntrada?: Dayjs | null
}

const CAMPOS_FORM: readonly (keyof CamposDoacao)[] = ['itemId', 'quantidade', 'doador', 'dataEntrada']

interface ModalDoacaoProps {
  aberto: boolean
  // null = registro de nova doação
  doacao: Doacao | null
  itens: ItemEstoque[]
  // Item já selecionado ao abrir o registro (atalho da tabela de estoque).
  itemInicialId?: string
  ehAdmin: boolean
  onFechar: () => void
  onSalva: (doacao: Doacao, nova: boolean) => void
  onDesatualizado: () => void
}

function ModalDoacao({
  aberto,
  doacao,
  itens,
  itemInicialId,
  ehAdmin,
  onFechar,
  onSalva,
  onDesatualizado,
}: ModalDoacaoProps) {
  const { message } = App.useApp()
  const [form] = Form.useForm<CamposDoacao>()
  const [salvando, setSalvando] = useState(false)
  const editando = doacao !== null

  const opcoes = useMemo(() => opcoesItens(itens), [itens])

  useEffect(() => {
    if (!aberto) return
    form.resetFields()
    if (doacao) {
      form.setFieldsValue({
        itemId: doacao.itemId,
        quantidade: doacao.quantidade,
        doador: doacao.doador,
        dataEntrada: dayjs(doacao.dataEntrada),
      })
    } else {
      form.setFieldsValue({ itemId: itemInicialId, dataEntrada: dayjs() })
    }
  }, [aberto, doacao, itemInicialId, form])

  async function salvar(valores: CamposDoacao) {
    const doador = valores.doador?.trim() ?? ''

    setSalvando(true)
    try {
      if (doacao) {
        // Só doador e data podem mudar; envia apenas o que mudou.
        const corpo: DadosDoacao = {}
        if ((doador || 'Anônimo') !== doacao.doador) corpo.doador = doador
        const dataEntrada = dataDaEdicao(valores.dataEntrada, doacao.dataEntrada)
        if (dataEntrada) corpo.dataEntrada = dataEntrada

        if (Object.keys(corpo).length === 0) {
          message.info('Nenhuma alteração para salvar.')
          onFechar()
          return
        }
        onSalva(await atualizarDoacao(doacao.id, corpo), false)
        message.success('Doação atualizada.')
      } else {
        const corpo: DadosDoacao = {
          itemId: valores.itemId,
          quantidade: valores.quantidade ?? undefined,
        }
        // Em branco, o servidor registra como "Anônimo".
        if (doador) corpo.doador = doador
        const dataEntrada = dataDoCadastro(valores.dataEntrada)
        if (dataEntrada) corpo.dataEntrada = dataEntrada

        onSalva(await criarDoacao(corpo), true)
        message.success('Doação registrada. O estoque foi atualizado.')
      }
    } catch (e) {
      form.setFields(errosDosCampos(e, CAMPOS_FORM))
      message.error(mensagemDeErro(e, 'Não foi possível salvar a doação. Tente novamente.'))
      if (statusDoErro(e) === 404) onDesatualizado()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal
      title={editando ? 'Editar doação' : 'Registrar doação'}
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
      <Form<CamposDoacao> form={form} layout="vertical" onFinish={salvar} disabled={salvando}>
        <Form.Item label="Item" name="itemId" rules={[{ required: true, message: 'Selecione o item doado.' }]}>
          <Select
            showSearch={{ filterOption: filtrarOpcaoItem }}
            placeholder="Selecione o item"
            options={opcoes}
            disabled={editando}
            notFoundContent={
              itens.length === 0
                ? ehAdmin
                  ? 'Nenhum item cadastrado. Cadastre o item primeiro.'
                  : 'Nenhum item cadastrado. Peça à coordenação para cadastrar.'
                : 'Nenhum item encontrado.'
            }
          />
        </Form.Item>

        <Flex gap={16} wrap>
          <Form.Item
            label="Quantidade"
            name="quantidade"
            rules={[
              { required: true, message: 'Informe a quantidade.' },
              { type: 'integer', min: 1, message: 'Informe um número inteiro maior que 0.' },
            ]}
            style={{ flex: '1 1 160px' }}
          >
            <InputNumber min={1} precision={0} placeholder="Ex.: 10" disabled={editando} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="Data de entrada"
            name="dataEntrada"
            rules={[{ required: true, message: 'Informe a data.' }]}
            style={{ flex: '1 1 160px' }}
          >
            <DatePicker format={FORMATO_DATA} disabledDate={diaFuturo} allowClear={false} style={{ width: '100%' }} />
          </Form.Item>
        </Flex>

        <Form.Item
          label="Doador"
          name="doador"
          rules={[{ max: MAX_TEXTO, message: `O nome do doador deve ter no máximo ${MAX_TEXTO} caracteres.` }]}
        >
          <Input placeholder="Em branco = Anônimo" />
        </Form.Item>

        {editando && (
          <Typography.Text type="secondary">
            Item e quantidade não podem ser alterados porque o estoque já foi ajustado. Para corrigi-los, exclua a
            doação e registre outra.
          </Typography.Text>
        )}
      </Form>
    </Modal>
  )
}

export default ModalDoacao
