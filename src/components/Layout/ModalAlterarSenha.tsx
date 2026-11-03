import { useEffect, useState } from 'react'
import { App, Form, Input, Modal } from 'antd'
import { trocarSenha } from '../../services/usuarios'
import { dadosDoErro, errosDosCampos, mensagemDeErro, statusDoErro } from '../../utils/erros'
import { DICA_SENHA, regrasConfirmacao, regrasSenha } from '../../utils/senha'

interface CamposSenha {
  senhaAtual?: string
  novaSenha?: string
  confirmarSenha?: string
}

const CAMPOS_FORM: readonly (keyof CamposSenha)[] = ['senhaAtual', 'novaSenha']

const MENSAGEM_SENHA_INCORRETA = 'Senha atual incorreta.'

interface ModalAlterarSenhaProps {
  aberto: boolean
  onFechar: () => void
}

// Troca da própria senha (qualquer perfil). A sessão continua: não desloga.
function ModalAlterarSenha({ aberto, onFechar }: ModalAlterarSenhaProps) {
  const { message } = App.useApp()
  const [form] = Form.useForm<CamposSenha>()
  const [salvando, setSalvando] = useState(false)

  // As senhas digitadas não ficam no formulário depois de fechar.
  useEffect(() => {
    if (aberto) form.resetFields()
  }, [aberto, form])

  async function salvar(valores: CamposSenha) {
    setSalvando(true)
    try {
      await trocarSenha({ senhaAtual: valores.senhaAtual ?? '', novaSenha: valores.novaSenha ?? '' })
      message.success('Senha alterada.')
      form.resetFields()
      onFechar()
    } catch (e) {
      const status = statusDoErro(e)
      if (status === 429) {
        message.error(mensagemDeErro(e, 'Muitas tentativas. Tente novamente mais tarde.'))
      } else if (status === 400 && dadosDoErro(e)?.error === MENSAGEM_SENHA_INCORRETA) {
        form.setFields([{ name: 'senhaAtual', errors: [MENSAGEM_SENHA_INCORRETA] }])
      } else {
        // 401 (sessão expirada ou usuário desativado) já leva ao login pelo interceptor
        message.error(mensagemDeErro(e, 'Não foi possível alterar a senha. Tente novamente.'))
        form.setFields(errosDosCampos(e, CAMPOS_FORM))
      }
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal
      title="Alterar senha"
      open={aberto}
      onCancel={() => !salvando && onFechar()}
      onOk={() => form.submit()}
      okText="Alterar senha"
      cancelText="Cancelar"
      confirmLoading={salvando}
      cancelButtonProps={{ disabled: salvando }}
      mask={{ closable: !salvando }}
      width={440}
      forceRender
    >
      <Form<CamposSenha> form={form} layout="vertical" onFinish={salvar} disabled={salvando}>
        <Form.Item label="Senha atual" name="senhaAtual" rules={[{ required: true, message: 'Informe a senha atual.' }]}>
          <Input.Password autoComplete="current-password" />
        </Form.Item>

        <Form.Item
          label="Nova senha"
          name="novaSenha"
          extra={DICA_SENHA}
          dependencies={['senhaAtual']}
          rules={[
            ...regrasSenha('Informe a nova senha.'),
            ({ getFieldValue }) => ({
              validator: (_, valor?: string) =>
                !valor || valor !== getFieldValue('senhaAtual')
                  ? Promise.resolve()
                  : Promise.reject(new Error('A nova senha deve ser diferente da atual.')),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>

        <Form.Item
          label="Confirmar nova senha"
          name="confirmarSenha"
          dependencies={['novaSenha']}
          rules={regrasConfirmacao('novaSenha')}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default ModalAlterarSenha
