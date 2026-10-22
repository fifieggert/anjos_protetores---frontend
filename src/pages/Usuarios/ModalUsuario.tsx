import { useEffect, useState } from 'react'
import { App, Checkbox, Flex, Form, Input, Modal, Select, Switch } from 'antd'
import { atualizarUsuario, criarUsuario } from '../../services/usuarios'
import { PERFIS, rotulosPerfil } from '../../types/auth'
import type { Perfil } from '../../types/auth'
import { LIMITES_USUARIO } from '../../types/usuario'
import type { DadosUsuario, UsuarioSistema } from '../../types/usuario'
import { dadosDoErro, errosDosCampos, mensagemDeErro, statusDoErro } from '../../utils/erros'
import { DICA_SENHA, regrasConfirmacao, regrasSenha } from '../../utils/senha'
import { formatarCpf, mascaraCpf, somenteDigitos } from '../../utils/texto'

export const MENSAGEM_SI_MESMO = 'Você não pode alterar a si mesmo'

interface CamposUsuario {
  nome?: string
  cpf?: string
  email?: string
  perfil?: Perfil
  ativo?: boolean
  redefinirSenha?: boolean
  senha?: string
  confirmarSenha?: string
}

// Campos que o backend pode devolver em "campos" (400).
const CAMPOS_FORM: readonly (keyof CamposUsuario)[] = ['nome', 'cpf', 'email', 'perfil', 'ativo', 'senha']

const opcoesPerfil = PERFIS.map((perfil) => ({ value: perfil, label: rotulosPerfil[perfil] }))

// 409 de cadastro duplicado: o backend diz qual campo na mensagem.
function campoDuplicado(mensagem: unknown): 'email' | 'cpf' | null {
  if (typeof mensagem !== 'string') return null
  if (mensagem.includes('e-mail')) return 'email'
  if (mensagem.includes('CPF')) return 'cpf'
  return null
}

// Cadastro: todos os campos. Edição: só o que mudou (e a senha, se for redefinida).
function montarCorpo(valores: CamposUsuario, usuario: UsuarioSistema | null): DadosUsuario {
  const novo = {
    nome: valores.nome?.trim() ?? '',
    cpf: somenteDigitos(valores.cpf ?? ''),
    email: valores.email?.trim().toLowerCase() ?? '',
    perfil: valores.perfil ?? 'VOLUNTARIO',
  }

  if (!usuario) return { ...novo, senha: valores.senha ?? '' }

  const corpo: DadosUsuario = {}
  if (novo.nome !== usuario.nome) corpo.nome = novo.nome
  if (novo.cpf !== usuario.cpf) corpo.cpf = novo.cpf
  if (novo.email !== usuario.email) corpo.email = novo.email
  if (novo.perfil !== usuario.perfil) corpo.perfil = novo.perfil
  if (valores.ativo !== undefined && valores.ativo !== usuario.ativo) corpo.ativo = valores.ativo
  if (valores.redefinirSenha && valores.senha) corpo.senha = valores.senha
  return corpo
}

interface ModalUsuarioProps {
  aberto: boolean
  // null = cadastro de novo usuário
  usuario: UsuarioSistema | null
  // o próprio usuário logado: perfil e situação ficam travados
  ehVoceMesmo: boolean
  onFechar: () => void
  onSalvo: (usuario: UsuarioSistema, novo: boolean) => void
  onDesatualizado: () => void
}

function ModalUsuario({ aberto, usuario, ehVoceMesmo, onFechar, onSalvo, onDesatualizado }: ModalUsuarioProps) {
  const { message } = App.useApp()
  const [form] = Form.useForm<CamposUsuario>()
  const [salvando, setSalvando] = useState(false)
  const editando = usuario !== null
  const redefinirSenha = Form.useWatch('redefinirSenha', form) ?? false
  const ativo = Form.useWatch('ativo', form)
  const pedeSenha = !editando || redefinirSenha

  useEffect(() => {
    if (!aberto) return
    form.resetFields()
    if (usuario) {
      form.setFieldsValue({
        nome: usuario.nome,
        cpf: formatarCpf(usuario.cpf),
        email: usuario.email,
        perfil: usuario.perfil,
        ativo: usuario.ativo,
      })
    } else {
      form.setFieldsValue({ perfil: 'VOLUNTARIO' })
    }
  }, [aberto, usuario, form])

  async function salvar(valores: CamposUsuario) {
    const corpo = montarCorpo(valores, usuario)

    setSalvando(true)
    try {
      if (usuario) {
        if (Object.keys(corpo).length === 0) {
          message.info('Nenhuma alteração para salvar.')
          onFechar()
          return
        }
        onSalvo(await atualizarUsuario(usuario.id, corpo), false)
        message.success(corpo.senha ? 'Usuário atualizado e senha redefinida.' : 'Usuário atualizado.')
      } else {
        onSalvo(await criarUsuario(corpo), true)
        message.success('Usuário cadastrado. Ele já pode entrar com o e-mail e a senha informados.')
      }
    } catch (e) {
      const status = statusDoErro(e)
      const mensagem = mensagemDeErro(e, 'Não foi possível salvar o usuário. Tente novamente.')
      const duplicado = status === 409 ? campoDuplicado(dadosDoErro(e)?.error) : null

      if (duplicado) {
        // e-mail ou CPF já cadastrado: o erro fica no próprio campo
        form.setFields([{ name: duplicado, errors: [mensagem] }])
      } else if (status === 404) {
        message.error(mensagem)
        onFechar()
        onDesatualizado()
      } else {
        // 409 das travas (a si mesmo, último ADMIN ativo) e demais erros
        message.error(mensagem)
        form.setFields(errosDosCampos(e, CAMPOS_FORM))
      }
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal
      title={editando ? 'Editar usuário' : 'Novo usuário'}
      open={aberto}
      onCancel={() => !salvando && onFechar()}
      onOk={() => form.submit()}
      okText={editando ? 'Salvar' : 'Cadastrar'}
      cancelText="Cancelar"
      confirmLoading={salvando}
      cancelButtonProps={{ disabled: salvando }}
      mask={{ closable: !salvando }}
      width={560}
      forceRender
    >
      <Form<CamposUsuario> form={form} layout="vertical" onFinish={salvar} disabled={salvando}>
        <Form.Item
          label="Nome"
          name="nome"
          rules={[
            { required: true, whitespace: true, message: 'Informe o nome.' },
            { max: LIMITES_USUARIO.textoMax, message: `O nome deve ter no máximo ${LIMITES_USUARIO.textoMax} caracteres.` },
          ]}
        >
          <Input placeholder="Nome completo" maxLength={LIMITES_USUARIO.textoMax} autoComplete="off" />
        </Form.Item>

        <Flex gap={16} wrap>
          <Form.Item
            label="CPF"
            name="cpf"
            normalize={(valor: string) => mascaraCpf(valor ?? '')}
            rules={[
              { required: true, message: 'Informe o CPF.' },
              {
                validator: (_, valor?: string) =>
                  !valor || somenteDigitos(valor).length === LIMITES_USUARIO.cpfDigitos
                    ? Promise.resolve()
                    : Promise.reject(new Error('O CPF deve ter 11 dígitos.')),
              },
            ]}
            style={{ flex: '1 1 180px' }}
          >
            <Input placeholder="000.000.000-00" inputMode="numeric" autoComplete="off" />
          </Form.Item>

          <Form.Item
            label="Perfil"
            name="perfil"
            tooltip={ehVoceMesmo ? MENSAGEM_SI_MESMO : undefined}
            rules={[{ required: true, message: 'Escolha o perfil.' }]}
            style={{ flex: '1 1 180px' }}
          >
            <Select options={opcoesPerfil} disabled={ehVoceMesmo} aria-label="Perfil" />
          </Form.Item>
        </Flex>

        <Form.Item
          label="E-mail"
          name="email"
          extra={editando ? undefined : 'Usado para entrar no sistema.'}
          rules={[
            { required: true, whitespace: true, message: 'Informe o e-mail.' },
            { type: 'email', message: 'Informe um e-mail válido.' },
            { max: LIMITES_USUARIO.textoMax, message: `O e-mail deve ter no máximo ${LIMITES_USUARIO.textoMax} caracteres.` },
          ]}
        >
          <Input placeholder="nome@exemplo.com" inputMode="email" autoComplete="off" maxLength={LIMITES_USUARIO.textoMax} />
        </Form.Item>

        {editando && (
          <Form.Item
            label="Situação"
            name="ativo"
            valuePropName="checked"
            tooltip={ehVoceMesmo ? MENSAGEM_SI_MESMO : undefined}
            extra={ativo === false ? 'Inativo: não consegue entrar no sistema.' : undefined}
          >
            <Switch checkedChildren="Ativo" unCheckedChildren="Inativo" disabled={ehVoceMesmo} aria-label="Usuário ativo" />
          </Form.Item>
        )}

        {editando && (
          <Form.Item name="redefinirSenha" valuePropName="checked" style={{ marginBottom: pedeSenha ? 12 : 0 }}>
            <Checkbox>Redefinir a senha deste usuário</Checkbox>
          </Form.Item>
        )}

        {pedeSenha && (
          <Flex gap={16} wrap>
            <Form.Item
              label={editando ? 'Nova senha' : 'Senha inicial'}
              name="senha"
              extra={DICA_SENHA}
              rules={regrasSenha()}
              style={{ flex: '1 1 200px' }}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Form.Item
              label="Confirmar senha"
              name="confirmarSenha"
              dependencies={['senha']}
              rules={regrasConfirmacao('senha')}
              style={{ flex: '1 1 200px' }}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
          </Flex>
        )}
      </Form>
    </Modal>
  )
}

export default ModalUsuario
