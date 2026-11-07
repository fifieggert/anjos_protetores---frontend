import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../../services/api'
import * as estoque from '../../services/estoque'
import { chamada, mockarAdapter, respondeErro, respondeOk } from '../helpers/api'

const dados = { quantidade: 2 } as never
const id = 'a/b'
const idNaUrl = 'a%2Fb'

let adapter: ReturnType<typeof mockarAdapter>
const aoAlterar = vi.fn()
let cancelar: () => void

beforeEach(() => {
  adapter = mockarAdapter(api)
  aoAlterar.mockClear()
  cancelar = estoque.aoAlterarEstoque(aoAlterar)
})

afterEach(() => {
  cancelar()
})

describe('mudanças que alteram o saldo avisam o card "Estoque baixo"', () => {
  it.each<[string, () => Promise<unknown>, string, string]>([
    ['criarItem', () => estoque.criarItem(dados), 'post', '/itens-estoque'],
    ['atualizarItem', () => estoque.atualizarItem(id, dados), 'put', `/itens-estoque/${idNaUrl}`],
    ['excluirItem', () => estoque.excluirItem(id), 'delete', `/itens-estoque/${idNaUrl}`],
    ['criarDoacao', () => estoque.criarDoacao(dados), 'post', '/doacoes'],
    ['excluirDoacao', () => estoque.excluirDoacao(id), 'delete', `/doacoes/${idNaUrl}`],
    ['criarSaida', () => estoque.criarSaida(dados), 'post', '/saidas-estoque'],
    ['excluirSaida', () => estoque.excluirSaida(id), 'delete', `/saidas-estoque/${idNaUrl}`],
  ])('%s', async (_, chamar, metodo, url) => {
    adapter.mockImplementation(respondeOk())

    await chamar()

    expect(chamada(adapter)).toMatchObject({ metodo, url })
    expect(aoAlterar).toHaveBeenCalledOnce()
  })
})

describe('mudanças que não alteram o saldo não avisam', () => {
  it.each<[string, () => Promise<unknown>, string, string]>([
    ['atualizarDoacao', () => estoque.atualizarDoacao(id, dados), 'put', `/doacoes/${idNaUrl}`],
    ['atualizarSaida', () => estoque.atualizarSaida(id, dados), 'put', `/saidas-estoque/${idNaUrl}`],
    ['listarItens', () => estoque.listarItens(), 'get', '/itens-estoque'],
    ['listarAlertas', () => estoque.listarAlertas(), 'get', '/itens-estoque/alertas'],
    ['listarDoacoes', () => estoque.listarDoacoes(), 'get', '/doacoes'],
    ['listarSaidas', () => estoque.listarSaidas(), 'get', '/saidas-estoque'],
  ])('%s', async (_, chamar, metodo, url) => {
    adapter.mockImplementation(respondeOk())

    await chamar()

    expect(chamada(adapter)).toMatchObject({ metodo, url })
    expect(aoAlterar).not.toHaveBeenCalled()
  })
})

describe('erro da API', () => {
  it('propaga o erro e não avisa, porque o saldo não mudou', async () => {
    adapter.mockImplementation(respondeErro(409, { error: 'Saldo insuficiente.' }))

    await expect(estoque.criarSaida(dados)).rejects.toMatchObject({ response: { status: 409 } })

    expect(aoAlterar).not.toHaveBeenCalled()
  })
})

describe('aoAlterarEstoque', () => {
  it('para de avisar depois de cancelar a inscrição', async () => {
    cancelar()
    adapter.mockImplementation(respondeOk())

    await estoque.criarItem(dados)

    expect(aoAlterar).not.toHaveBeenCalled()
  })
})
