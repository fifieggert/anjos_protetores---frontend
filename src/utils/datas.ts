import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

export const FORMATO_DATA = 'DD/MM/YYYY'

export function formatarData(iso: string | null | undefined) {
  if (!iso) return '-'
  const data = dayjs(iso)
  return data.isValid() ? data.format(FORMATO_DATA) : '-'
}

// Para o DatePicker: movimentações não podem ter data futura.
export function diaFuturo(dia: Dayjs) {
  return dia.isAfter(dayjs(), 'day')
}

// O DatePicker escolhe só o dia. Envia o dia com a hora de referência (a atual, ou a
// original na edição) e o fuso, para o dia não mudar ao ser gravado em UTC.
export function dataParaApi(dia: Dayjs, referencia: Dayjs = dayjs()) {
  return dia
    .hour(referencia.hour())
    .minute(referencia.minute())
    .second(referencia.second())
    .millisecond(0)
    .toISOString()
}

// Data a enviar no cadastro: hoje é omitido (o servidor usa o momento do registro).
export function dataDoCadastro(dia: Dayjs | null | undefined) {
  if (!dia || dia.isSame(dayjs(), 'day')) return undefined
  return dataParaApi(dia)
}

// Data a enviar na edição: só quando o dia mudou, mantendo o horário original.
export function dataDaEdicao(dia: Dayjs | null | undefined, originalIso: string) {
  const original = dayjs(originalIso)
  if (!dia || (original.isValid() && dia.isSame(original, 'day'))) return undefined
  return dataParaApi(dia, original.isValid() ? original : dayjs())
}

// Para o DatePicker: eventos novos não podem ser marcados em dia passado.
export function diaPassado(dia: Dayjs) {
  return dia.isBefore(dayjs(), 'day')
}

// Datas "só dia" (ex.: castração, revacinação), sem hora que importe.
// Envio: meio-dia local. Em qualquer fuso do Brasil isso cai no mesmo dia em UTC,
// então o dia não muda ao ser gravado nem ao ser lido de volta.
export function diaParaApi(dia: Dayjs) {
  return dia.hour(12).minute(0).second(0).millisecond(0).toISOString()
}

// Leitura: usa só o AAAA-MM-DD do valor gravado, como dia local. Assim tanto o
// meio-dia enviado por diaParaApi quanto uma data gravada à meia-noite UTC
// (ex.: "2026-01-10" enviado direto à API) aparecem no dia certo, não no anterior.
export function diaDaApi(iso: string | null | undefined) {
  if (!iso) return null
  // o dayjs lê "AAAA-MM-DD" (sem hora nem fuso) como dia local
  const dia = dayjs(iso.slice(0, 10))
  return dia.isValid() ? dia : null
}

export function formatarDia(iso: string | null | undefined) {
  return diaDaApi(iso)?.format(FORMATO_DATA) ?? '-'
}

// Dia da semana por extenso, ex.: "terça-feira".
export function diaDaSemana(iso: string | null | undefined) {
  const dia = diaDaApi(iso)
  return dia ? dia.toDate().toLocaleDateString('pt-BR', { weekday: 'long' }) : ''
}

const MESES_ABREVIADOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

// Mês abreviado de uma data "só dia", ex.: "out".
export function mesAbreviado(iso: string | null | undefined) {
  const dia = diaDaApi(iso)
  return dia ? (MESES_ABREVIADOS[dia.month()] ?? '') : ''
}

// Horário de um evento: "09:00 às 16:00" ou "a partir das 09:00".
export function textoHorario(inicio: string, fim: string | null | undefined) {
  return fim ? `${inicio} às ${fim}` : `a partir das ${inicio}`
}

// Dias de calendário desde a data (0 = hoje).
export function diasDesde(iso: string) {
  const data = dayjs(iso)
  return data.isValid() ? Math.max(0, dayjs().startOf('day').diff(data.startOf('day'), 'day')) : 0
}

export function textoDiasDesde(dias: number) {
  if (dias === 0) return 'hoje'
  return dias === 1 ? 'há 1 dia' : `há ${dias} dias`
}
