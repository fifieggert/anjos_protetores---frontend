import { formatarTelefone } from '../../utils/texto'

// Dados de contato exibidos na página pública. Itens vazios não aparecem.
// TODO: preencher com os dados reais do abrigo antes de publicar.

// Somente dígitos, com 55 e DDD (ex.: 5547999999999). Vem de VITE_WHATSAPP_ABRIGO no .env.
function whatsappDoAmbiente() {
  const valor: unknown = import.meta.env.VITE_WHATSAPP_ABRIGO
  return typeof valor === 'string' && /^55\d{10,11}$/.test(valor.trim()) ? valor.trim() : ''
}

export const dadosAbrigo = {
  nome: 'Anjos Protetores',
  whatsapp: whatsappDoAmbiente(),
  // TODO: e-mail de contato, ex.: 'contato@anjosprotetores.org.br'
  email: '',
  // TODO: endereço ou cidade, ex.: 'Rua Exemplo, 123 - Cidade/UF'
  endereco: '',
  // TODO: link completo do perfil, ex.: 'https://instagram.com/anjosprotetores'
  instagram: '',
  // TODO: link completo da página, ex.: 'https://facebook.com/anjosprotetores'
  facebook: '',
}

export const MENSAGEM_DOACAO = 'Olá! Quero fazer uma doação para o Anjos Protetores.'

// Link do WhatsApp com mensagem pronta; null quando o número não está configurado.
export function linkWhatsApp(mensagem?: string) {
  if (!dadosAbrigo.whatsapp) return null
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : ''
  return `https://wa.me/${dadosAbrigo.whatsapp}${texto}`
}

// (47) 99999-9999 a partir de 5547999999999, para exibir no rodapé.
export function whatsappFormatado() {
  return formatarTelefone(dadosAbrigo.whatsapp.slice(2))
}
