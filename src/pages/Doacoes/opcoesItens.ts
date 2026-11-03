import { rotulosCategoria } from '../../types/estoque'
import type { ItemEstoque } from '../../types/estoque'
import { normalizar, rotulo } from '../../utils/texto'

// Opções do Select de item, em ordem alfabética, com categoria e saldo atual.
export function opcoesItens(itens: ItemEstoque[]) {
  return [...itens]
    .sort((a, b) => a.nomeItem.localeCompare(b.nomeItem, 'pt-BR'))
    .map((item) => ({
      value: item.id,
      label: `${item.nomeItem} · ${rotulo(rotulosCategoria, item.categoria)} (${item.quantidadeAtual} em estoque)`,
      nome: item.nomeItem,
    }))
}

// Busca do Select ignorando acentos e maiúsculas.
export function filtrarOpcaoItem(entrada: string, opcao?: { nome?: string }) {
  return normalizar(opcao?.nome ?? '').includes(normalizar(entrada.trim()))
}
