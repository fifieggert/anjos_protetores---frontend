import { useCallback, useEffect, useMemo, useState } from 'react'
import { App, Avatar, Button, Card, Col, Empty, Flex, Input, Popconfirm, Result, Row, Select, Table, Tag, Tooltip, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  StopOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import Indicador from '../../components/Indicador'
import { useAuth } from '../../contexts/AuthContext'
import { atualizarUsuario, excluirUsuario, listarUsuarios } from '../../services/usuarios'
import { cores, comOpacidade } from '../../theme/cores'
import { PERFIS, rotulosPerfil } from '../../types/auth'
import type { Perfil } from '../../types/auth'
import type { UsuarioSistema } from '../../types/usuario'
import { formatarData } from '../../utils/datas'
import { mensagemDeErro, statusDoErro } from '../../utils/erros'
import { formatarCpf, normalizar, rotulo, somenteDigitos } from '../../utils/texto'
import ModalUsuario, { MENSAGEM_SI_MESMO } from './ModalUsuario'

const TAMANHO_PAGINA = 10

type Situacao = 'ativos' | 'inativos'
type Acao = 'situacao' | 'excluir'

const coresPerfil: Record<Perfil, string> = {
  ADMIN: cores.primaria,
  VOLUNTARIO: cores.teal,
}

const opcoesPerfil = PERFIS.map((perfil) => ({ value: perfil, label: rotulosPerfil[perfil] }))

const opcoesSituacao: { value: Situacao; label: string }[] = [
  { value: 'ativos', label: 'Ativos' },
  { value: 'inativos', label: 'Inativos' },
]

function Usuarios() {
  const { message } = App.useApp()
  const { usuario: logado } = useAuth()

  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([])
  const [carregando, setCarregando] = useState(true)
  const [falhou, setFalhou] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroPerfil, setFiltroPerfil] = useState<Perfil | undefined>(undefined)
  const [filtroSituacao, setFiltroSituacao] = useState<Situacao | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [processando, setProcessando] = useState<{ id: string; acao: Acao } | null>(null)
  // undefined = modal fechado; null = cadastro; UsuarioSistema = edição
  const [modal, setModal] = useState<UsuarioSistema | null | undefined>(undefined)

  // Incrementar a versão refaz a busca da lista.
  const [versaoLista, setVersaoLista] = useState(0)

  const carregar = useCallback(() => {
    setCarregando(true)
    setVersaoLista((versao) => versao + 1)
  }, [])

  // A API não filtra: a lista vem inteira e a busca e os filtros são feitos aqui.
  useEffect(() => {
    let ativo = true
    listarUsuarios()
      .then((lista) => {
        if (!ativo) return
        setUsuarios(Array.isArray(lista) ? lista : [])
        setFalhou(false)
      })
      .catch((e: unknown) => {
        if (!ativo) return
        setFalhou(true)
        message.error(mensagemDeErro(e, 'Não foi possível carregar os usuários.'))
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
      ativos: usuarios.filter((u) => u.ativo).length,
      coordenacao: usuarios.filter((u) => u.ativo && u.perfil === 'ADMIN').length,
      inativos: usuarios.filter((u) => !u.ativo).length,
    }),
    [usuarios],
  )

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim())
    const digitos = somenteDigitos(busca)
    return usuarios.filter((u) => {
      if (filtroPerfil && u.perfil !== filtroPerfil) return false
      if (filtroSituacao && u.ativo !== (filtroSituacao === 'ativos')) return false
      if (!termo) return true
      if (normalizar(`${u.nome} ${u.email}`).includes(termo)) return true
      return digitos.length >= 3 && u.cpf.includes(digitos)
    })
  }, [usuarios, busca, filtroPerfil, filtroSituacao])

  const ehVoceMesmo = (u: UsuarioSistema) => u.id === logado?.id
  const ocupado = (u: UsuarioSistema, acao: Acao) => processando?.id === u.id && processando.acao === acao

  // 404/409 vêm com a mensagem da API (inclusive as travas: a si mesmo, último ADMIN ativo,
  // usuário com registros vinculados). 404: a lista estava desatualizada, recarrega.
  async function alternarSituacao(u: UsuarioSistema) {
    setProcessando({ id: u.id, acao: 'situacao' })
    try {
      const salvo = await atualizarUsuario(u.id, { ativo: !u.ativo })
      setUsuarios((lista) => lista.map((atual) => (atual.id === salvo.id ? salvo : atual)))
      message.success(salvo.ativo ? `Acesso de ${salvo.nome} reativado.` : `Acesso de ${salvo.nome} desativado.`)
    } catch (e) {
      message.error(mensagemDeErro(e, 'Não foi possível alterar a situação. Tente novamente.'))
      if (statusDoErro(e) === 404) carregar()
    } finally {
      setProcessando(null)
    }
  }

  async function excluir(u: UsuarioSistema) {
    setProcessando({ id: u.id, acao: 'excluir' })
    try {
      await excluirUsuario(u.id)
      setUsuarios((lista) => lista.filter((atual) => atual.id !== u.id))
      message.success('Usuário excluído.')
    } catch (e) {
      message.error(mensagemDeErro(e, 'Não foi possível excluir o usuário. Tente novamente.'))
      if (statusDoErro(e) === 404) carregar()
    } finally {
      setProcessando(null)
    }
  }

  function aoSalvar(salvo: UsuarioSistema, novo: boolean) {
    setUsuarios((lista) => (novo ? [salvo, ...lista] : lista.map((atual) => (atual.id === salvo.id ? salvo : atual))))
    setModal(undefined)
  }

  const colunas: TableColumnsType<UsuarioSistema> = [
    {
      title: 'Nome',
      key: 'nome',
      render: (_, u) => (
        <Flex align="center" gap={12} style={{ minWidth: 180 }}>
          <Avatar
            size={40}
            icon={<UserOutlined />}
            style={{ flexShrink: 0, color: coresPerfil[u.perfil], background: comOpacidade(coresPerfil[u.perfil], 0.15) }}
          />
          <div style={{ minWidth: 0 }}>
            <Typography.Text strong style={{ display: 'block' }}>
              {u.nome}
              {ehVoceMesmo(u) && (
                <Typography.Text type="secondary" style={{ fontWeight: 400 }}>
                  {' '}
                  (você)
                </Typography.Text>
              )}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Desde {formatarData(u.criadoEm)}
            </Typography.Text>
          </div>
        </Flex>
      ),
    },
    {
      title: 'E-mail',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'CPF',
      dataIndex: 'cpf',
      key: 'cpf',
      render: (cpf: string) => <span style={{ whiteSpace: 'nowrap' }}>{formatarCpf(cpf)}</span>,
    },
    {
      title: 'Perfil',
      dataIndex: 'perfil',
      key: 'perfil',
      render: (perfil: Perfil) => (
        <Tag color={coresPerfil[perfil] ?? cores.textoSecundario}>{rotulo(rotulosPerfil, perfil)}</Tag>
      ),
    },
    {
      title: 'Situação',
      dataIndex: 'ativo',
      key: 'ativo',
      render: (ativo: boolean) => <Tag color={ativo ? cores.sucesso : cores.textoSecundario}>{ativo ? 'Ativo' : 'Inativo'}</Tag>,
    },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_, u) => {
        const voce = ehVoceMesmo(u)
        return (
          <Flex gap={4}>
            <Tooltip title="Editar">
              <Button type="text" icon={<EditOutlined />} aria-label={`Editar ${u.nome}`} onClick={() => setModal(u)} />
            </Tooltip>

            <Popconfirm
              title={u.ativo ? 'Desativar este usuário?' : 'Reativar este usuário?'}
              description={
                <div style={{ maxWidth: 280 }}>
                  {u.ativo
                    ? `${u.nome} não conseguirá mais entrar no sistema. O histórico do que registrou é mantido.`
                    : `${u.nome} voltará a conseguir entrar no sistema.`}
                </div>
              }
              okText={u.ativo ? 'Desativar' : 'Reativar'}
              cancelText="Voltar"
              okButtonProps={{ danger: u.ativo }}
              onConfirm={() => alternarSituacao(u)}
              disabled={voce}
            >
              <Tooltip title={voce ? MENSAGEM_SI_MESMO : u.ativo ? 'Desativar' : 'Reativar'}>
                <Button
                  type="text"
                  icon={u.ativo ? <StopOutlined /> : <CheckCircleOutlined style={{ color: cores.sucesso }} />}
                  aria-label={u.ativo ? `Desativar ${u.nome}` : `Reativar ${u.nome}`}
                  loading={ocupado(u, 'situacao')}
                  disabled={voce}
                />
              </Tooltip>
            </Popconfirm>

            <Popconfirm
              title="Excluir este usuário?"
              description={
                <div style={{ maxWidth: 300 }}>
                  Prefira desativar: a exclusão é definitiva. Se {u.nome} registrou animais, doações, saídas,
                  termos ou eventos, o sistema não deixa excluir para não perder esse histórico.
                </div>
              }
              okText="Excluir"
              cancelText="Voltar"
              okButtonProps={{ danger: true }}
              onConfirm={() => excluir(u)}
              disabled={voce}
            >
              <Tooltip title={voce ? MENSAGEM_SI_MESMO : 'Excluir'}>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={`Excluir ${u.nome}`}
                  loading={ocupado(u, 'excluir')}
                  disabled={voce}
                />
              </Tooltip>
            </Popconfirm>
          </Flex>
        )
      },
    },
  ]

  const temFiltro = busca.trim() !== '' || filtroPerfil !== undefined || filtroSituacao !== undefined

  const conteudo = falhou ? (
    <Result
      status="warning"
      title="Não foi possível carregar os usuários."
      extra={
        <Button type="primary" onClick={carregar} loading={carregando}>
          Tentar de novo
        </Button>
      }
    />
  ) : (
    <Flex vertical gap={16}>
      <Flex gap={12} wrap>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: cores.textoSecundario }} />}
          placeholder="Buscar por nome, e-mail ou CPF"
          aria-label="Buscar por nome, e-mail ou CPF"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value)
            setPagina(1)
          }}
          style={{ flex: '1 1 240px', maxWidth: 400 }}
        />
        <Select<Perfil>
          allowClear
          placeholder="Todos os perfis"
          aria-label="Filtrar por perfil"
          options={opcoesPerfil}
          value={filtroPerfil}
          onChange={(valor) => {
            setFiltroPerfil(valor)
            setPagina(1)
          }}
          style={{ width: 180 }}
        />
        <Select<Situacao>
          allowClear
          placeholder="Todas as situações"
          aria-label="Filtrar por situação"
          options={opcoesSituacao}
          value={filtroSituacao}
          onChange={(valor) => {
            setFiltroSituacao(valor)
            setPagina(1)
          }}
          style={{ width: 180 }}
        />
      </Flex>
      <Table<UsuarioSistema>
        rowKey="id"
        columns={colunas}
        dataSource={filtrados}
        loading={carregando}
        onRow={(u) => (u.ativo ? {} : { style: { opacity: 0.6 } })}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={temFiltro ? 'Nenhum usuário encontrado com esses filtros.' : 'Nenhum usuário cadastrado ainda.'}
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
      <Flex justify="space-between" align="center" wrap gap={16}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          Usuários
        </Typography.Title>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setModal(null)}>
          Novo usuário
        </Button>
      </Flex>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Indicador titulo="Usuários ativos" valor={indicadores.ativos} icone={<TeamOutlined />} cor={cores.primaria} />
        </Col>
        <Col xs={24} sm={8}>
          <Indicador
            titulo="Coordenação ativa"
            valor={indicadores.coordenacao}
            icone={<SafetyCertificateOutlined />}
            cor={cores.teal}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Indicador titulo="Inativos" valor={indicadores.inativos} icone={<StopOutlined />} cor={cores.textoSecundario} />
        </Col>
      </Row>

      <Card>{conteudo}</Card>

      <ModalUsuario
        aberto={modal !== undefined}
        usuario={modal ?? null}
        ehVoceMesmo={!!modal && ehVoceMesmo(modal)}
        onFechar={() => setModal(undefined)}
        onSalvo={aoSalvar}
        onDesatualizado={carregar}
      />
    </Flex>
  )
}

export default Usuarios
