import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SecaoAnimais from '../../pages/Publico/SecaoAnimais'
import { listarAnimaisPublicos, registrarInteresse } from '../../services/publico'
import type { AnimalPublico } from '../../types/publico'
import { erroAxios } from '../helpers/api'
import { renderComAntd } from '../helpers/render'

vi.mock('../../services/publico')

const rex: AnimalPublico = {
  id: 'a1',
  nome: 'Rex',
  especie: 'CACHORRO',
  raca: 'Vira-lata',
  idade: 3,
  porte: 'GRANDE',
  sexo: 'MACHO',
  castrado: true,
  vacinado: true,
  descricao: 'Adora passear.',
  fotoUrl: 'https://fotos.exemplo/rex.jpg',
}

const mia: AnimalPublico = {
  id: 'a2',
  nome: 'Mia',
  especie: 'GATO',
  raca: null,
  idade: null,
  porte: 'PEQUENO',
  sexo: null,
  castrado: false,
  vacinado: false,
  descricao: null,
  fotoUrl: null,
}

const listar = vi.mocked(listarAnimaisPublicos)
const registrar = vi.mocked(registrarInteresse)

beforeEach(() => {
  listar.mockReset()
  registrar.mockReset()
})

function cartao(nome: string) {
  const elemento = screen.getByRole('heading', { name: nome }).closest('.ant-card')
  if (!(elemento instanceof HTMLElement)) throw new Error(`Cartão de ${nome} não encontrado.`)
  return within(elemento)
}

async function abrirModal(animal = rex) {
  listar.mockResolvedValue([animal])
  renderComAntd(<SecaoAnimais />)
  await userEvent.click(await screen.findByRole('button', { name: `Ver mais sobre ${animal.nome}` }))
  return screen.findByRole('dialog')
}

async function preencher(nome: string, celular: string) {
  await userEvent.type(screen.getByLabelText('Seu nome'), nome)
  await userEvent.type(screen.getByLabelText('Celular (WhatsApp)'), celular)
  await userEvent.click(screen.getByRole('checkbox'))
}

const enviar = () => userEvent.click(screen.getByRole('button', { name: 'Enviar interesse' }))

async function enviarFormularioValido() {
  await preencher('Ana Souza', '47999998888')
  await enviar()
}

describe('listagem', () => {
  it('mostra esqueletos enquanto carrega', () => {
    listar.mockReturnValue(new Promise(() => undefined))

    renderComAntd(<SecaoAnimais />)

    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument()
  })

  it('mostra os dados de cada animal', async () => {
    listar.mockResolvedValue([rex, mia])

    renderComAntd(<SecaoAnimais />)

    await screen.findByRole('heading', { name: 'Rex' })
    expect(cartao('Rex').getByText('Cachorro · 3 anos')).toBeInTheDocument()
    expect(cartao('Rex').getByText('Grande · Macho')).toBeInTheDocument()
    expect(cartao('Rex').getByText('Vacinado')).toBeInTheDocument()
    expect(cartao('Rex').getByText('Castrado')).toBeInTheDocument()
    expect(cartao('Rex').getByRole('img', { name: 'Foto de Rex' })).toHaveAttribute('src', rex.fotoUrl)
  })

  it('trata os dados opcionais que faltam', async () => {
    listar.mockResolvedValue([mia])

    renderComAntd(<SecaoAnimais />)

    await screen.findByRole('heading', { name: 'Mia' })
    expect(cartao('Mia').getByText('Gato · Idade não informada')).toBeInTheDocument()
    expect(cartao('Mia').getByText('Pequeno')).toBeInTheDocument()
    expect(cartao('Mia').queryByText('Vacinado')).not.toBeInTheDocument()
    expect(cartao('Mia').getByRole('img', { name: 'Mia (sem foto)' })).toBeInTheDocument()
  })

  it('troca a foto que não carrega pela imagem padrão', async () => {
    listar.mockResolvedValue([rex])
    renderComAntd(<SecaoAnimais />)

    const foto = await screen.findByRole('img', { name: 'Foto de Rex' })
    foto.dispatchEvent(new Event('error'))

    expect(await screen.findByRole('img', { name: 'Rex (sem foto)' })).toBeInTheDocument()
  })

  it('avisa quando não há animais', async () => {
    listar.mockResolvedValue([])

    renderComAntd(<SecaoAnimais />)

    expect(await screen.findByText('Nenhum animal disponível com esse filtro no momento.')).toBeInTheDocument()
  })

  it('resposta inesperada da API vira lista vazia', async () => {
    listar.mockResolvedValue({ erro: true } as unknown as AnimalPublico[])

    renderComAntd(<SecaoAnimais />)

    expect(await screen.findByText('Nenhum animal disponível com esse filtro no momento.')).toBeInTheDocument()
  })

  it('mostra erro e permite tentar de novo', async () => {
    listar.mockRejectedValueOnce(erroAxios(500)).mockResolvedValueOnce([rex])
    renderComAntd(<SecaoAnimais />)

    expect(await screen.findByText('Não foi possível carregar os animais.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByRole('heading', { name: 'Rex' })).toBeInTheDocument()
    expect(screen.queryByText('Não foi possível carregar os animais.')).not.toBeInTheDocument()
  })
})

describe('filtros', () => {
  it('sem filtro, busca todos', async () => {
    listar.mockResolvedValue([rex])

    renderComAntd(<SecaoAnimais />)

    await screen.findByRole('heading', { name: 'Rex' })
    expect(listar).toHaveBeenCalledWith({})
  })

  it('filtra por espécie', async () => {
    listar.mockResolvedValueOnce([rex, mia]).mockResolvedValueOnce([mia])
    renderComAntd(<SecaoAnimais />)
    await screen.findByRole('heading', { name: 'Rex' })

    await userEvent.click(screen.getByText('Gatos'))

    await waitFor(() => expect(listar).toHaveBeenLastCalledWith({ especie: 'GATO' }))
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Rex' })).not.toBeInTheDocument())
    expect(screen.getByRole('heading', { name: 'Mia' })).toBeInTheDocument()
  })

  it('filtra por porte e combina com a espécie', async () => {
    listar.mockResolvedValue([rex])
    renderComAntd(<SecaoAnimais />)
    await screen.findByRole('heading', { name: 'Rex' })

    await userEvent.click(screen.getByText('Cachorros'))
    await userEvent.click(screen.getByRole('combobox', { name: 'Filtrar por porte' }))
    await userEvent.click(await screen.findByTitle('Grande'))

    await waitFor(() => expect(listar).toHaveBeenLastCalledWith({ especie: 'CACHORRO', porte: 'GRANDE' }))
  })

  it('volta a buscar todos ao escolher "Todos"', async () => {
    listar.mockResolvedValue([rex])
    renderComAntd(<SecaoAnimais />)
    await screen.findByRole('heading', { name: 'Rex' })
    await userEvent.click(screen.getByText('Gatos'))
    await waitFor(() => expect(listar).toHaveBeenLastCalledWith({ especie: 'GATO' }))

    await userEvent.click(screen.getByText('Todos'))

    await waitFor(() => expect(listar).toHaveBeenLastCalledWith({}))
  })
})

describe('detalhes do animal', () => {
  it('mostra os detalhes no modal', async () => {
    const modal = within(await abrirModal())

    expect(modal.getByRole('heading', { name: 'Rex' })).toBeInTheDocument()
    expect(modal.getByText('Vira-lata')).toBeInTheDocument()
    expect(modal.getByText('Adora passear.')).toBeInTheDocument()
  })

  it('completa os dados que faltam', async () => {
    const modal = within(await abrirModal(mia))

    expect(modal.getByText('Não informada')).toBeInTheDocument()
    expect(modal.getByText('Não informado')).toBeInTheDocument()
    expect(modal.getAllByText('Não')).toHaveLength(2)
  })
})

describe('formulário de interesse: validação', () => {
  it('exige nome, celular e autorização, sem chamar a API', async () => {
    await abrirModal()

    await enviar()

    expect(await screen.findByText('Informe seu nome.')).toBeInTheDocument()
    expect(await screen.findByText('Informe seu celular.')).toBeInTheDocument()
    expect(await screen.findByText('É preciso autorizar o contato para registrar o interesse.')).toBeInTheDocument()
    expect(registrar).not.toHaveBeenCalled()
  })

  it('recusa nome só com espaços', async () => {
    await abrirModal()

    await preencher('   ', '47999998888')
    await enviar()

    expect(await screen.findByText('Informe seu nome.')).toBeInTheDocument()
    expect(registrar).not.toHaveBeenCalled()
  })

  it('recusa nome curto demais', async () => {
    await abrirModal()

    await preencher('A', '47999998888')
    await enviar()

    expect(await screen.findByText('Informe ao menos 2 caracteres.')).toBeInTheDocument()
    expect(registrar).not.toHaveBeenCalled()
  })

  it.each([
    ['sem o nono dígito', '4733334444'],
    ['DDD inexistente', '20999998888'],
  ])('recusa celular %s', async (_, celular) => {
    await abrirModal()

    await preencher('Ana Souza', celular)
    await enviar()

    expect(await screen.findByText('Informe um celular com DDD, por exemplo (47) 99999-9999.')).toBeInTheDocument()
    expect(registrar).not.toHaveBeenCalled()
  })

  it('exige a autorização de contato mesmo com o resto preenchido', async () => {
    await abrirModal()

    await userEvent.type(screen.getByLabelText('Seu nome'), 'Ana Souza')
    await userEvent.type(screen.getByLabelText('Celular (WhatsApp)'), '47999998888')
    await enviar()

    expect(await screen.findByText('É preciso autorizar o contato para registrar o interesse.')).toBeInTheDocument()
    expect(registrar).not.toHaveBeenCalled()
  })

  it('aplica a máscara enquanto a pessoa digita', async () => {
    await abrirModal()

    await userEvent.type(screen.getByLabelText('Celular (WhatsApp)'), '47999998888')

    expect(screen.getByLabelText('Celular (WhatsApp)')).toHaveValue('(47) 99999-8888')
  })
})

describe('formulário de interesse: envio', () => {
  it('envia os dados limpos, só com os dígitos do celular', async () => {
    registrar.mockResolvedValue({ mensagem: 'ok' })
    await abrirModal()

    await preencher('  Ana   Souza ', '47999998888')
    await enviar()

    await waitFor(() => expect(registrar).toHaveBeenCalledOnce())
    expect(registrar).toHaveBeenCalledWith({
      animalId: 'a1',
      nome: 'Ana Souza',
      telefone: '47999998888',
      aceitaContato: true,
    })
  })

  it('confirma o envio e atualiza a lista, porque o animal ficou reservado', async () => {
    registrar.mockResolvedValue({ mensagem: 'ok' })
    await abrirModal()
    listar.mockResolvedValue([])

    await enviarFormularioValido()

    expect(await screen.findByText('Recebemos seu interesse!')).toBeInTheDocument()
    expect(screen.getByText('O abrigo entrará em contato para conversar sobre a adoção de Rex.')).toBeInTheDocument()
    expect(listar).toHaveBeenCalledTimes(2)
    expect(await screen.findByText('Nenhum animal disponível com esse filtro no momento.')).toBeInTheDocument()
  })

  it('nome e telefone não ficam no armazenamento do navegador', async () => {
    registrar.mockResolvedValue({ mensagem: 'ok' })
    await abrirModal()

    await enviarFormularioValido()
    await screen.findByText('Recebemos seu interesse!')

    expect(localStorage).toHaveLength(0)
    expect(sessionStorage).toHaveLength(0)
  })
})

describe('formulário de interesse: erros', () => {
  it('400 com campos: mostra o erro no campo', async () => {
    registrar.mockRejectedValue(erroAxios(400, { campos: { telefone: 'Telefone recusado.' } }))
    await abrirModal()

    await enviarFormularioValido()

    expect(await screen.findByText('Telefone recusado.')).toBeInTheDocument()
  })

  it('400 sem campos: mostra a mensagem da API', async () => {
    registrar.mockRejectedValue(erroAxios(400, { error: 'Dados inválidos.' }))
    await abrirModal()

    await enviarFormularioValido()

    expect(await screen.findByRole('alert')).toHaveTextContent('Dados inválidos.')
  })

  it('409 com o animal já reservado: avisa e fecha o modal', async () => {
    registrar.mockRejectedValue(erroAxios(409, { error: 'Este animal já foi reservado.' }))
    await abrirModal()
    listar.mockResolvedValue([])

    await enviarFormularioValido()

    expect(await screen.findByText('Este animal já foi reservado.')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByLabelText('Seu nome')).not.toBeInTheDocument())
  })

  it('409 com o animal ainda disponível: é o telefone repetido, mantém o modal aberto', async () => {
    registrar.mockRejectedValue(erroAxios(409, { error: 'Telefone já tem interesse em andamento.' }))
    await abrirModal()

    await enviarFormularioValido()

    expect(await screen.findByRole('alert')).toHaveTextContent('Telefone já tem interesse em andamento.')
    expect(screen.getByLabelText('Seu nome')).toBeInTheDocument()
  })

  it('409 sem conseguir conferir a lista: mantém o modal aberto', async () => {
    registrar.mockRejectedValue(erroAxios(409, { error: 'Conflito.' }))
    await abrirModal()
    listar.mockRejectedValue(erroAxios())

    await enviarFormularioValido()

    expect(await screen.findByRole('alert')).toHaveTextContent('Conflito.')
    expect(screen.getByLabelText('Seu nome')).toBeInTheDocument()
  })

  it('404: avisa que o animal saiu da lista, fecha e atualiza', async () => {
    registrar.mockRejectedValue(erroAxios(404))
    await abrirModal()
    listar.mockResolvedValue([])

    await enviarFormularioValido()

    expect(await screen.findByText('Este animal não está mais disponível para adoção.')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByLabelText('Seu nome')).not.toBeInTheDocument())
    expect(await screen.findByText('Nenhum animal disponível com esse filtro no momento.')).toBeInTheDocument()
  })

  it('429: pede para tentar mais tarde, sem botão de reenvio', async () => {
    registrar.mockRejectedValue(erroAxios(429))
    await abrirModal()

    await enviarFormularioValido()

    expect(await screen.findByRole('alert')).toHaveTextContent('Recebemos muitos pedidos deste aparelho.')
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).not.toBeInTheDocument()
  })

  it('falha de rede: mantém os dados digitados e permite reenviar', async () => {
    registrar.mockRejectedValueOnce(erroAxios()).mockResolvedValueOnce({ mensagem: 'ok' })
    await abrirModal()
    await enviarFormularioValido()
    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('Não foi possível conectar ao servidor.')
    expect(screen.getByLabelText('Seu nome')).toHaveValue('Ana Souza')

    await userEvent.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByText('Recebemos seu interesse!')).toBeInTheDocument()
    expect(registrar).toHaveBeenCalledTimes(2)
  })
})
