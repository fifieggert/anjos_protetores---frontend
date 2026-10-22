import { useState } from 'react'
import { Alert, App, Button, Checkbox, Descriptions, Divider, Form, Input, Modal, Result, Typography } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { registrarInteresse } from '../../services/publico'
import { cores } from '../../theme/cores'
import { rotulosEspecie, rotulosPorte, rotulosSexo } from '../../types/animal'
import type { AnimalPublico } from '../../types/publico'
import { errosDosCampos, mensagemDeErro, statusDoErro } from '../../utils/erros'
import { celularValido, digitosDoCelular, formatarIdade, mascaraCelular, rotulo } from '../../utils/texto'
import FotoAnimal from './FotoAnimal'

const NOME_MIN = 2
const NOME_MAX = 100

interface CamposInteresse {
  nome?: string
  telefone?: string
  aceitaContato?: boolean
}

const CAMPOS_FORM: readonly (keyof CamposInteresse)[] = ['nome', 'telefone', 'aceitaContato']

// Aviso dentro do modal; tentarDeNovo mostra o botão para reenviar (ex.: erro de rede).
interface Aviso {
  texto: string
  tentarDeNovo?: boolean
}

// Nome sem espaços nas pontas nem repetidos no meio (mesma regra do backend).
function limparNome(nome: string | undefined) {
  return (nome ?? '').trim().replace(/\s+/g, ' ')
}

function simOuNao(valor: boolean) {
  return valor ? 'Sim' : 'Não'
}

interface ConteudoProps {
  animal: AnimalPublico
  onFechar: () => void
  onInteresseRegistrado: () => void
  // Recarrega a lista e devolve os animais disponíveis (null se falhou).
  onConferirDisponiveis: () => Promise<AnimalPublico[] | null>
}

// Conteúdo do modal. Montado de novo a cada abertura: nome e telefone ficam só no
// estado deste componente e somem ao fechar (nada em console, armazenamento ou URL).
function ConteudoModal({ animal, onFechar, onInteresseRegistrado, onConferirDisponiveis }: ConteudoProps) {
  const { message } = App.useApp()
  const [form] = Form.useForm<CamposInteresse>()
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [aviso, setAviso] = useState<Aviso | null>(null)

  async function enviar(valores: CamposInteresse) {
    setEnviando(true)
    setAviso(null)
    try {
      await registrarInteresse({
        animalId: animal.id,
        nome: limparNome(valores.nome),
        telefone: digitosDoCelular(valores.telefone ?? ''),
        aceitaContato: true,
      })
      form.resetFields()
      setEnviado(true)
      // o animal agora está reservado e sai da lista
      onInteresseRegistrado()
    } catch (e) {
      const status = statusDoErro(e)
      if (status === 400) {
        const campos = errosDosCampos(e, CAMPOS_FORM)
        form.setFields(campos)
        if (campos.length === 0) setAviso({ texto: mensagemDeErro(e, 'Confira os dados e tente novamente.') })
      } else if (status === 409) {
        // 409 pode ser o animal já reservado por outra pessoa ou este telefone já ter um
        // interesse em andamento. A lista atualizada diz qual dos dois.
        const mensagem = mensagemDeErro(e, 'Não foi possível registrar o interesse.')
        const disponiveis = await onConferirDisponiveis()
        if (disponiveis && !disponiveis.some((atual) => atual.id === animal.id)) {
          message.warning(mensagem)
          onFechar()
          return
        }
        setAviso({ texto: mensagem })
      } else if (status === 404) {
        message.warning('Este animal não está mais disponível para adoção.')
        onFechar()
        void onConferirDisponiveis()
        return
      } else if (status === 429) {
        setAviso({ texto: 'Recebemos muitos pedidos deste aparelho. Tente novamente mais tarde.' })
      } else {
        setAviso({
          texto: mensagemDeErro(e, 'Não foi possível enviar seu interesse. Tente novamente.'),
          tentarDeNovo: true,
        })
      }
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <Result
        status="success"
        title={<span id="titulo-modal-animal">Recebemos seu interesse!</span>}
        subTitle={`O abrigo entrará em contato para conversar sobre a adoção de ${animal.nome}.`}
        extra={
          <Button type="primary" size="large" onClick={onFechar}>
            Fechar
          </Button>
        }
      />
    )
  }

  const itens = [
    { key: 'especie', label: 'Espécie', children: rotulo(rotulosEspecie, animal.especie) },
    { key: 'raca', label: 'Raça', children: animal.raca || 'Não informada' },
    { key: 'idade', label: 'Idade', children: formatarIdade(animal.idade) ?? 'Idade não informada' },
    { key: 'porte', label: 'Porte', children: rotulo(rotulosPorte, animal.porte) },
    { key: 'sexo', label: 'Sexo', children: animal.sexo ? rotulo(rotulosSexo, animal.sexo) : 'Não informado' },
    { key: 'castrado', label: 'Castrado', children: simOuNao(animal.castrado) },
    { key: 'vacinado', label: 'Vacinado', children: simOuNao(animal.vacinado) },
  ]

  return (
    <>
      <div style={{ margin: '-4px 0 20px', borderRadius: 20, overflow: 'hidden' }}>
        <FotoAnimal url={animal.fotoUrl} nome={animal.nome} style={{ aspectRatio: '16 / 10', maxHeight: 360 }} />
      </div>

      <Typography.Title level={2} id="titulo-modal-animal" style={{ margin: '0 0 12px' }}>
        {animal.nome}
      </Typography.Title>

      <Descriptions size="small" column={{ xs: 1, sm: 2 }} items={itens} />

      {animal.descricao && (
        <Typography.Paragraph style={{ marginTop: 16, whiteSpace: 'pre-line' }}>{animal.descricao}</Typography.Paragraph>
      )}

      <Divider />

      <Typography.Title level={3} style={{ marginTop: 0, fontSize: 20 }}>
        Tenho interesse em adotar
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Deixe seu nome e celular. Nossa equipe entra em contato para conversar sobre a adoção.
      </Typography.Paragraph>

      {aviso && (
        <Alert
          type="warning"
          showIcon
          title={aviso.texto}
          style={{ marginBottom: 16 }}
          action={
            aviso.tentarDeNovo ? (
              <Button size="small" onClick={() => form.submit()} loading={enviando}>
                Tentar de novo
              </Button>
            ) : undefined
          }
        />
      )}

      <Form<CamposInteresse> form={form} layout="vertical" onFinish={enviar} disabled={enviando} requiredMark={false}>
        <Form.Item
          label="Seu nome"
          name="nome"
          rules={[
            { required: true, whitespace: true, message: 'Informe seu nome.' },
            {
              validator: (_, valor?: string) => {
                const tamanho = limparNome(valor).length
                if (tamanho === 0) return Promise.resolve()
                if (tamanho < NOME_MIN) return Promise.reject(new Error(`Informe ao menos ${NOME_MIN} caracteres.`))
                if (tamanho > NOME_MAX) return Promise.reject(new Error(`Use no máximo ${NOME_MAX} caracteres.`))
                return Promise.resolve()
              },
            },
          ]}
        >
          <Input autoComplete="name" maxLength={NOME_MAX} placeholder="Nome e sobrenome" />
        </Form.Item>

        <Form.Item
          label="Celular (WhatsApp)"
          name="telefone"
          normalize={(valor: string) => mascaraCelular(valor ?? '')}
          validateTrigger="onBlur"
          rules={[
            { required: true, message: 'Informe seu celular.' },
            {
              validator: (_, valor?: string) =>
                !valor || celularValido(digitosDoCelular(valor))
                  ? Promise.resolve()
                  : Promise.reject(new Error('Informe um celular com DDD, por exemplo (47) 99999-9999.')),
            },
          ]}
        >
          <Input autoComplete="tel-national" inputMode="tel" placeholder="(47) 99999-9999" />
        </Form.Item>

        <Form.Item
          name="aceitaContato"
          valuePropName="checked"
          rules={[
            {
              validator: (_, valor?: boolean) =>
                valor
                  ? Promise.resolve()
                  : Promise.reject(new Error('É preciso autorizar o contato para registrar o interesse.')),
            },
          ]}
        >
          <Checkbox>
            Autorizo o abrigo a entrar em contato comigo por telefone ou WhatsApp sobre a adoção.
          </Checkbox>
        </Form.Item>

        <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
          <LockOutlined aria-hidden style={{ marginRight: 6, color: cores.teal }} />
          Usamos seu nome e telefone apenas para falar sobre esta adoção.
        </Typography.Paragraph>

        <Button type="primary" htmlType="submit" size="large" block loading={enviando}>
          Enviar interesse
        </Button>
      </Form>
    </>
  )
}

interface ModalAnimalProps extends Omit<ConteudoProps, 'animal'> {
  // null = fechado
  animal: AnimalPublico | null
}

function ModalAnimal({ animal, onFechar, ...resto }: ModalAnimalProps) {
  return (
    <Modal
      open={animal !== null}
      onCancel={onFechar}
      footer={null}
      width={640}
      centered
      destroyOnHidden
      aria-labelledby="titulo-modal-animal"
    >
      {animal && <ConteudoModal key={animal.id} animal={animal} onFechar={onFechar} {...resto} />}
    </Modal>
  )
}

export default ModalAnimal
