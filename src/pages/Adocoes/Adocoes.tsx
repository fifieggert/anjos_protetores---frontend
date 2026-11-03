import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { App, Avatar, Button, Card, Col, Empty, Flex, Input, Popconfirm, Result, Row, Table, Tabs, Tag, Tooltip, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  FileTextOutlined,
  HeartOutlined,
  PhoneOutlined,
  SearchOutlined,
  WhatsAppOutlined,
} from '@ant-design/icons'
import Indicador from '../../components/Indicador'
import {
  cancelarAdocao,
  concluirAdocao,
  excluirSolicitacao,
  listarSolicitacoes,
  marcarEmContato,
} from '../../services/adocoes'
import { baixarPdfTermo, criarTermo } from '../../services/termos'
import { cores, comOpacidade } from '../../theme/cores'
import { rotulosEspecie } from '../../types/animal'
import { STATUS_EM_ANDAMENTO, rotulosStatusSolicitacao } from '../../types/adocao'
import type { SolicitacaoAdocao, StatusSolicitacao } from '../../types/adocao'
import { diasDesde, formatarData, textoDiasDesde } from '../../utils/datas'
import { mensagemDeErro, statusDoErro } from '../../utils/erros'
import { formatarTelefone, normalizar, rotulo, somenteDigitos } from '../../utils/texto'

const TAMANHO_PAGINA = 10

// Em andamento há mais tempo que isso, o "há X dias" fica destacado.
const DIAS_PARA_DESTAQUE = 7

type Aba = 'andamento' | 'concluidas' | 'recusadas' | 'todas'
type Acao = 'contato' | 'concluir' | 'cancelar' | 'excluir' | 'termo'

const coresStatus: Record<StatusSolicitacao, string> = {
  PENDENTE: cores.laranja,
  EM_CONTATO: cores.primaria,
  APROVADA: cores.sucesso,
  RECUSADA: cores.textoSecundario,
}

// Tempo para a aba carregar o PDF antes de a URL do blob ser liberada.
const MS_PARA_LIBERAR_PDF = 60_000

const filtroDaAba: Record<Aba, (status: StatusSolicitacao) => boolean> = {
  andamento: (status) => STATUS_EM_ANDAMENTO.includes(status),
  concluidas: (status) => status === 'APROVADA',
  recusadas: (status) => status === 'RECUSADA',
  todas: () => true,
}

const vazioDaAba: Record<Aba, string> = {
  andamento: 'Nenhum interesse em andamento. Quando alguém registrar interesse pela página pública, ele aparece aqui.',
  concluidas: 'Nenhuma adoção concluída ainda.',
  recusadas: 'Nenhum interesse marcado como "não deu certo".',
  todas: 'Nenhum interesse registrado ainda.',
}

function emAndamento(solicitacao: SolicitacaoAdocao) {
  return STATUS_EM_ANDAMENTO.includes(solicitacao.status)
}

function nomeDoAnimal(solicitacao: SolicitacaoAdocao) {
  return solicitacao.animal?.nome ?? 'o animal'
}

function podeGerarTermo(solicitacao: SolicitacaoAdocao) {
  return solicitacao.status === 'EM_CONTATO' || solicitacao.status === 'APROVADA'
}

function nomeArquivoTermo(nomeAnimal: string) {
  const slug = normalizar(nomeAnimal)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `termo-adocao-${slug || 'animal'}.pdf`
}

// Plano B quando o navegador bloqueia a nova aba: baixa o arquivo.
function baixarArquivo(url: string, nomeArquivo: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
}

function Adocoes() {
  const { message } = App.useApp()

  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoAdocao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [falhou, setFalhou] = useState(false)
  const [aba, setAba] = useState<Aba>('andamento')
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)
  const [processando, setProcessando] = useState<{ id: string; acao: Acao } | null>(null)
  // Trava síncrona contra clique duplo (o estado só desabilita o botão no próximo render).
  const gerandoTermo = useRef(false)

  // Incrementar a versão refaz a busca da lista.
  const [versaoLista, setVersaoLista] = useState(0)

  const carregar = useCallback(() => {
    setCarregando(true)
    setVersaoLista((versao) => versao + 1)
  }, [])

  useEffect(() => {
    let ativo = true
    listarSolicitacoes()
      .then((lista) => {
        if (!ativo) return
        setSolicitacoes(Array.isArray(lista) ? lista : [])
        setFalhou(false)
      })
      .catch((e: unknown) => {
        if (!ativo) return
        setFalhou(true)
        message.error(mensagemDeErro(e, 'Não foi possível carregar os interesses de adoção.'))
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [versaoLista, message])

  const indicadores = useMemo(
    () => ({
      aguardando: solicitacoes.filter((s) => s.status === 'PENDENTE').length,
      emContato: solicitacoes.filter((s) => s.status === 'EM_CONTATO').length,
      concluidas: solicitacoes.filter((s) => s.status === 'APROVADA').length,
    }),
    [solicitacoes],
  )

  const contagemDasAbas = useMemo(() => {
    const contar = (aba: Aba) => solicitacoes.filter((s) => filtroDaAba[aba](s.status)).length
    return { andamento: contar('andamento'), concluidas: contar('concluidas'), recusadas: contar('recusadas'), todas: solicitacoes.length }
  }, [solicitacoes])

  const filtradas = useMemo(() => {
    const termo = normalizar(busca.trim())
    const digitos = somenteDigitos(busca)
    return solicitacoes.filter((solicitacao) => {
      if (!filtroDaAba[aba](solicitacao.status)) return false
      if (!termo) return true
      if (normalizar(`${solicitacao.nome ?? ''} ${solicitacao.animal?.nome ?? ''}`).includes(termo)) return true
      return digitos !== '' && (solicitacao.telefone ?? '').includes(digitos)
    })
  }, [solicitacoes, aba, busca])

  // Executa uma ação da linha. A resposta (quando há) substitui a solicitação na lista;
  // sem resposta (exclusão), ela sai da lista. 404/409: a ação não vale mais, recarrega.
  async function executar(
    solicitacao: SolicitacaoAdocao,
    acao: Acao,
    chamada: () => Promise<SolicitacaoAdocao | void>,
    sucesso: string,
    generica: string,
  ) {
    setProcessando({ id: solicitacao.id, acao })
    try {
      const atualizada = await chamada()
      setSolicitacoes((lista) =>
        atualizada
          ? lista.map((atual) => (atual.id === solicitacao.id ? { ...atual, ...atualizada } : atual))
          : lista.filter((atual) => atual.id !== solicitacao.id),
      )
      message.success(sucesso)
    } catch (e) {
      message.error(mensagemDeErro(e, generica))
      const status = statusDoErro(e)
      if (status === 404 || status === 409) carregar()
    } finally {
      setProcessando(null)
    }
  }

  // Abre o PDF do termo numa nova aba. A aba é aberta em branco ANTES das chamadas à API,
  // ainda dentro do clique, para o navegador não bloquear o pop-up.
  async function gerarTermo(solicitacao: SolicitacaoAdocao) {
    const animal = solicitacao.animal
    if (!animal || gerandoTermo.current) return
    gerandoTermo.current = true
    setProcessando({ id: solicitacao.id, acao: 'termo' })

    const aba = window.open('', '_blank')
    if (aba) {
      aba.opener = null
      aba.document.title = 'Gerando termo...'
    }

    try {
      const termo = await criarTermo(animal.id, solicitacao.id)
      const pdf = await baixarPdfTermo(termo.id)
      const url = URL.createObjectURL(pdf)
      if (aba && !aba.closed) aba.location.href = url
      else baixarArquivo(url, nomeArquivoTermo(animal.nome))
      window.setTimeout(() => URL.revokeObjectURL(url), MS_PARA_LIBERAR_PDF)
      message.success('Termo gerado.')
    } catch (e) {
      aba?.close()
      message.error(mensagemDeErro(e, 'Não foi possível gerar o termo.'))
      const status = statusDoErro(e)
      if (status === 404 || status === 409) carregar()
    } finally {
      gerandoTermo.current = false
      setProcessando(null)
    }
  }

  const ocupado = (solicitacao: SolicitacaoAdocao, acao: Acao) =>
    processando?.id === solicitacao.id && processando.acao === acao

  const colunas: TableColumnsType<SolicitacaoAdocao> = [
    {
      title: 'Animal',
      key: 'animal',
      render: (_, solicitacao) => (
        <Flex align="center" gap={12} style={{ minWidth: 160 }}>
          <Avatar
            size={44}
            src={solicitacao.animal?.fotoUrl || undefined}
            alt={solicitacao.animal?.nome}
            icon={<HeartOutlined />}
            style={{ flexShrink: 0, color: cores.teal, background: comOpacidade(cores.teal, 0.15) }}
          />
          <div style={{ minWidth: 0 }}>
            <Typography.Text strong style={{ display: 'block' }}>
              {solicitacao.animal?.nome ?? '-'}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {rotulo(rotulosEspecie, solicitacao.animal?.especie)}
            </Typography.Text>
          </div>
        </Flex>
      ),
    },
    {
      title: 'Interessado',
      dataIndex: 'nome',
      key: 'nome',
    },
    {
      title: 'Telefone',
      dataIndex: 'telefone',
      key: 'telefone',
      render: (telefone: string) => <span style={{ whiteSpace: 'nowrap' }}>{formatarTelefone(telefone)}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: StatusSolicitacao) => (
        <Tag color={coresStatus[status] ?? cores.textoSecundario}>{rotulo(rotulosStatusSolicitacao, status)}</Tag>
      ),
    },
    {
      title: 'Registrado',
      key: 'criadoEm',
      render: (_, solicitacao) => {
        const dias = diasDesde(solicitacao.criadoEm)
        const atrasado = emAndamento(solicitacao) && dias > DIAS_PARA_DESTAQUE
        return (
          <Tooltip title={`Registrado em ${formatarData(solicitacao.criadoEm)}`}>
            <span
              style={{
                whiteSpace: 'nowrap',
                color: atrasado ? cores.laranja : undefined,
                fontWeight: atrasado ? 600 : undefined,
              }}
            >
              {atrasado && <ClockCircleOutlined aria-hidden style={{ marginRight: 6 }} />}
              {textoDiasDesde(dias)}
            </span>
          </Tooltip>
        )
      },
    },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_, solicitacao) => {
        const animal = nomeDoAnimal(solicitacao)
        const botaoExcluir = (
          <Popconfirm
            title="Excluir os dados desta pessoa?"
            description={
              <div style={{ maxWidth: 280 }}>
                Apaga o nome e o telefone desta pessoa. Se o interesse estiver em andamento, o animal volta a ficar
                disponível. Esta ação não pode ser desfeita.
              </div>
            }
            okText="Excluir dados"
            cancelText="Voltar"
            okButtonProps={{ danger: true }}
            onConfirm={() =>
              executar(
                solicitacao,
                'excluir',
                () => excluirSolicitacao(solicitacao.id),
                'Dados do interessado excluídos.',
                'Não foi possível excluir os dados. Tente novamente.',
              )
            }
          >
            <Tooltip title="Excluir dados">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                aria-label="Excluir dados do interessado"
                loading={ocupado(solicitacao, 'excluir')}
              />
            </Tooltip>
          </Popconfirm>
        )

        const botaoTermo =
          solicitacao.status === 'RECUSADA' ? null : podeGerarTermo(solicitacao) ? (
            <Tooltip title="Gerar termo de adoção">
              <Button
                type="text"
                icon={<FileTextOutlined />}
                aria-label={`Gerar termo de adoção de ${animal}`}
                loading={ocupado(solicitacao, 'termo')}
                // um termo por vez: os botões das outras linhas esperam
                disabled={!solicitacao.animal || (processando?.acao === 'termo' && !ocupado(solicitacao, 'termo'))}
                onClick={() => gerarTermo(solicitacao)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Disponível quando o interessado estiver em contato">
              <Button
                type="text"
                icon={<FileTextOutlined />}
                aria-label="Gerar termo (disponível quando o interessado estiver em contato)"
                disabled
              />
            </Tooltip>
          )

        if (!emAndamento(solicitacao)) {
          return (
            <Flex gap={4}>
              {botaoTermo}
              {botaoExcluir}
            </Flex>
          )
        }

        return (
          <Flex gap={4}>
            <Tooltip title="Conversar no WhatsApp">
              <Button
                type="text"
                icon={<WhatsAppOutlined style={{ color: cores.sucesso }} />}
                aria-label="Abrir conversa no WhatsApp"
                href={`https://wa.me/55${somenteDigitos(solicitacao.telefone)}`}
                target="_blank"
                rel="noopener noreferrer"
              />
            </Tooltip>
            {solicitacao.status === 'PENDENTE' && (
              <Tooltip title="Marcar em contato">
                <Button
                  type="text"
                  icon={<PhoneOutlined />}
                  aria-label="Marcar em contato"
                  loading={ocupado(solicitacao, 'contato')}
                  onClick={() =>
                    executar(
                      solicitacao,
                      'contato',
                      () => marcarEmContato(solicitacao.id),
                      'Marcado como em contato.',
                      'Não foi possível atualizar o status. Tente novamente.',
                    )
                  }
                />
              </Tooltip>
            )}
            {botaoTermo}
            <Popconfirm
              title="Concluir a adoção?"
              description={
                <div style={{ maxWidth: 280 }}>
                  O animal {animal} ficará como Adotado e sairá da lista de disponíveis.
                </div>
              }
              okText="Concluir adoção"
              cancelText="Voltar"
              onConfirm={() =>
                executar(
                  solicitacao,
                  'concluir',
                  () => concluirAdocao(solicitacao.id),
                  `Adoção de ${animal} concluída.`,
                  'Não foi possível concluir a adoção. Tente novamente.',
                )
              }
            >
              <Tooltip title="Concluir adoção">
                <Button
                  type="text"
                  icon={<CheckCircleOutlined style={{ color: cores.sucesso }} />}
                  aria-label="Concluir adoção"
                  loading={ocupado(solicitacao, 'concluir')}
                />
              </Tooltip>
            </Popconfirm>
            <Popconfirm
              title="Marcar como não deu certo?"
              description={
                <div style={{ maxWidth: 280 }}>O animal {animal} voltará a ficar disponível na página pública.</div>
              }
              okText="Não deu certo"
              cancelText="Voltar"
              onConfirm={() =>
                executar(
                  solicitacao,
                  'cancelar',
                  () => cancelarAdocao(solicitacao.id),
                  `${animal} voltou a ficar disponível.`,
                  'Não foi possível cancelar o interesse. Tente novamente.',
                )
              }
            >
              <Tooltip title="Não deu certo">
                <Button
                  type="text"
                  icon={<CloseCircleOutlined />}
                  aria-label="Não deu certo"
                  loading={ocupado(solicitacao, 'cancelar')}
                />
              </Tooltip>
            </Popconfirm>
            {botaoExcluir}
          </Flex>
        )
      },
    },
  ]

  const abas = [
    { key: 'andamento', label: `Em andamento (${contagemDasAbas.andamento})` },
    { key: 'concluidas', label: `Concluídas (${contagemDasAbas.concluidas})` },
    { key: 'recusadas', label: `Não deu certo (${contagemDasAbas.recusadas})` },
    { key: 'todas', label: `Todas (${contagemDasAbas.todas})` },
  ]

  const conteudo = falhou ? (
    <Result
      status="warning"
      title="Não foi possível carregar os interesses de adoção."
      extra={
        <Button type="primary" onClick={carregar} loading={carregando}>
          Tentar de novo
        </Button>
      }
    />
  ) : (
    <Flex vertical gap={16}>
      <Input
        allowClear
        prefix={<SearchOutlined style={{ color: cores.textoSecundario }} />}
        placeholder="Buscar por interessado, telefone ou animal"
        aria-label="Buscar por interessado, telefone ou animal"
        value={busca}
        onChange={(e) => {
          setBusca(e.target.value)
          setPagina(1)
        }}
        style={{ maxWidth: 400 }}
      />
      <Table<SolicitacaoAdocao>
        rowKey="id"
        columns={colunas}
        dataSource={filtradas}
        loading={carregando}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={busca.trim() ? 'Nenhum interesse encontrado para esta busca.' : vazioDaAba[aba]}
            />
          ),
        }}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: pagina,
          pageSize: TAMANHO_PAGINA,
          showSizeChanger: false,
          hideOnSinglePage: true,
          onChange: setPagina,
        }}
      />
    </Flex>
  )

  return (
    <Flex vertical gap={24}>
      <Typography.Title level={2} style={{ margin: 0 }}>
        Adoções
      </Typography.Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Indicador
            titulo="Aguardando contato"
            valor={indicadores.aguardando}
            icone={<ClockCircleOutlined />}
            cor={indicadores.aguardando > 0 ? cores.laranja : cores.textoSecundario}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Indicador titulo="Em contato" valor={indicadores.emContato} icone={<PhoneOutlined />} cor={cores.primaria} />
        </Col>
        <Col xs={24} sm={8}>
          <Indicador
            titulo="Adoções concluídas"
            valor={indicadores.concluidas}
            icone={<HeartOutlined />}
            cor={cores.sucesso}
          />
        </Col>
      </Row>

      <Card styles={{ body: { paddingTop: 8 } }}>
        <Tabs
          activeKey={aba}
          onChange={(chave) => {
            setAba(chave as Aba)
            setPagina(1)
          }}
          items={abas}
        />
        {conteudo}
      </Card>
    </Flex>
  )
}

export default Adocoes
