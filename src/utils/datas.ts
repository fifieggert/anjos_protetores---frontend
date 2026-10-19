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
