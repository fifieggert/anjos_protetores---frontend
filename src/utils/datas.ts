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
