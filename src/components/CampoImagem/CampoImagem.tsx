import { useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import { Button, Flex, Typography } from 'antd'
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import { enviarImagem } from '../../services/imagens'
import { cores } from '../../theme/cores'
import { urlImagem } from '../../utils/imagem'
import { TIPOS_ACEITOS, ehEnvioCancelado, mensagemErroUpload, validarArquivoImagem } from './regras'

// Texto só para leitores de tela (anúncios de "enviando", "enviada", "removida").
const SOMENTE_LEITOR: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
}

export interface CampoImagemProps {
  // Controlado pelo Form.Item: caminho interno (/api/imagens/...) ou URL antiga http(s).
  value?: string | null
  onChange?: (valor: string | null) => void
  // Repassado pelo Form.Item: o <label> do campo leva o foco para o botão de envio.
  id?: string
  // Texto alternativo da pré-visualização, ex.: "Foto de Thor".
  textoAlternativo: string
  disabled?: boolean
  // Avisa o formulário durante o envio (para não salvar antes de a foto chegar).
  onEnviandoChange?: (enviando: boolean) => void
}

// Campo de foto para formulários do antd: envia a imagem para POST /api/imagens e guarda no
// formulário só o caminho devolvido pelo servidor. A pré-visualização usa esse caminho (não um
// blob: local), então a CSP não precisa liberar blob:.
function CampoImagem({ value, onChange, id, textoAlternativo, disabled, onEnviandoChange }: CampoImagemProps) {
  const entrada = useRef<HTMLInputElement>(null)
  // Envio em andamento (null = nenhum). Um AbortController NOVO a cada envio (criar na
  // montagem quebraria no StrictMode, que monta, desmonta e monta de novo em dev). É ref, além
  // do estado "enviando", porque dois cliques seguidos chegam antes de o React atualizar.
  // Só o envio que ainda é o atual pode mexer no formulário: um envio cancelado, trocado por
  // outro ou de um componente desmontado (modal fechado) é ignorado mesmo se a resposta chegar.
  const envioAtual = useRef<AbortController | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [anuncio, setAnuncio] = useState('')
  const [srcQueFalhou, setSrcQueFalhou] = useState<string | null>(null)

  const idDica = useId()
  const idErro = useId()

  // versão atual do callback, para a limpeza do efeito abaixo (que roda só ao desmontar)
  const avisarEnvio = useRef(onEnviandoChange)
  useEffect(() => {
    avisarEnvio.current = onEnviandoChange
  }, [onEnviandoChange])

  // Cancela o envio em andamento, se houver. Devolve true se havia um.
  function cancelarEnvio() {
    const controle = envioAtual.current
    if (!controle) return false
    envioAtual.current = null
    controle.abort()
    return true
  }

  // Desmontagem (ex.: modal fechado): cancela o envio, para a imagem não ficar no servidor sem
  // uso, e libera o botão Salvar do formulário. Nenhum estado é atualizado depois disso.
  useEffect(
    () => () => {
      if (cancelarEnvio()) avisarEnvio.current?.(false)
    },
    [],
  )

  const src = urlImagem(value)
  const mostrarPrevia = src !== undefined && src !== srcQueFalhou

  function abrirSeletor() {
    if (envioAtual.current) return
    entrada.current?.click()
  }

  async function aoEscolher(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0]
    // limpa a seleção: escolher o mesmo arquivo de novo dispara o onChange outra vez
    evento.target.value = ''
    if (!arquivo) return

    const motivo = validarArquivoImagem(arquivo)
    if (motivo) {
      setErro(motivo)
      setAnuncio('')
      return
    }

    // outro arquivo escolhido durante um envio: o anterior é cancelado e vale o mais novo
    cancelarEnvio()
    const controle = new AbortController()
    envioAtual.current = controle
    setEnviando(true)
    onEnviandoChange?.(true)
    setErro(null)
    setAnuncio('Enviando a foto...')
    try {
      const url = await enviarImagem(arquivo, controle.signal)
      if (envioAtual.current !== controle) return
      onChange?.(url)
      setAnuncio('Foto enviada.')
    } catch (e) {
      // cancelamento não é erro: sem mensagem
      if (envioAtual.current !== controle || ehEnvioCancelado(e)) return
      setErro(mensagemErroUpload(e))
      setAnuncio('')
    } finally {
      // Só o envio atual encerra o "enviando". Cancelado por remover() ou pela desmontagem,
      // quem cancelou já avisou; trocado por outro envio, o novo continua "enviando".
      if (envioAtual.current === controle) {
        envioAtual.current = null
        setEnviando(false)
        onEnviandoChange?.(false)
      }
    }
  }

  function remover() {
    // remover durante um envio: cancela o envio e libera o formulário
    if (cancelarEnvio()) {
      setEnviando(false)
      onEnviandoChange?.(false)
    }
    onChange?.(null)
    setErro(null)
    setAnuncio('Foto removida.')
  }

  return (
    <Flex vertical gap={8} align="flex-start">
      {mostrarPrevia ? (
        <img
          src={src}
          alt={textoAlternativo}
          onError={() => setSrcQueFalhou(src)}
          style={{
            display: 'block',
            width: 160,
            height: 120,
            objectFit: 'cover',
            borderRadius: 8,
            border: `1px solid ${cores.borda}`,
            background: cores.fundoSuave,
          }}
        />
      ) : (
        value && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Não foi possível carregar a foto atual.
          </Typography.Text>
        )
      )}

      <Flex gap={8} wrap>
        <Button
          id={id}
          icon={<UploadOutlined aria-hidden />}
          loading={enviando}
          disabled={disabled}
          onClick={abrirSeletor}
          aria-describedby={erro ? `${idDica} ${idErro}` : idDica}
        >
          {enviando ? 'Enviando...' : value ? 'Trocar foto' : 'Enviar foto'}
        </Button>
        {value && (
          <Button danger icon={<DeleteOutlined aria-hidden />} disabled={disabled} onClick={remover}>
            Remover foto
          </Button>
        )}
      </Flex>

      <Typography.Text id={idDica} type="secondary" style={{ fontSize: 12 }}>
        JPG, PNG ou WebP, com até 5 MB.
      </Typography.Text>

      {erro && (
        <Typography.Text id={idErro} type="danger" role="alert">
          {erro}
        </Typography.Text>
      )}

      <span aria-live="polite" style={SOMENTE_LEITOR}>
        {anuncio}
      </span>

      {/* escondido: quem abre o seletor é o botão acima (focável pelo teclado) */}
      <input
        ref={entrada}
        type="file"
        accept={TIPOS_ACEITOS.join(',')}
        hidden
        tabIndex={-1}
        aria-hidden
        data-testid="entrada-imagem"
        onChange={aoEscolher}
      />
    </Flex>
  )
}

export default CampoImagem
