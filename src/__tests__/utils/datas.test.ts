import dayjs from 'dayjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  dataDaEdicao,
  dataDoCadastro,
  dataParaApi,
  diaDaApi,
  diaDaSemana,
  diaFuturo,
  diaParaApi,
  diaPassado,
  diasDesde,
  formatarData,
  formatarDia,
  mesAbreviado,
  rotuloMes,
  textoDiasDesde,
  textoHorario,
} from '../../utils/datas'

// "Hoje" fixo: 15/06/2026 às 10:30 em Brasília (o fuso dos testes, ver vitest.config.ts).
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-06-15T13:30:45.000Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('formatarData', () => {
  it('formata a data no fuso local', () => {
    expect(formatarData('2026-06-15T13:30:00.000Z')).toBe('15/06/2026')
  })

  it('usa o dia local quando em UTC já é o dia seguinte', () => {
    expect(formatarData('2026-06-16T01:00:00.000Z')).toBe('15/06/2026')
  })

  it.each([null, undefined, '', 'nao-e-data'])('mostra "-" para %s', (valor) => {
    expect(formatarData(valor)).toBe('-')
  })
})

describe('limites do DatePicker', () => {
  it('diaFuturo só bloqueia a partir de amanhã', () => {
    expect(diaFuturo(dayjs('2026-06-15'))).toBe(false)
    expect(diaFuturo(dayjs('2026-06-16'))).toBe(true)
  })

  it('diaPassado só bloqueia até ontem', () => {
    expect(diaPassado(dayjs('2026-06-15'))).toBe(false)
    expect(diaPassado(dayjs('2026-06-14'))).toBe(true)
  })
})

describe('dataParaApi', () => {
  it('mantém o dia escolhido com a hora de referência', () => {
    expect(dataParaApi(dayjs('2026-03-10'), dayjs('2026-01-01T08:15:20'))).toBe('2026-03-10T11:15:20.000Z')
  })

  it('usa a hora atual como referência por padrão', () => {
    expect(dataParaApi(dayjs('2026-03-10'))).toBe('2026-03-10T13:30:45.000Z')
  })
})

describe('dataDoCadastro', () => {
  it('omite hoje: o servidor usa o momento do registro', () => {
    expect(dataDoCadastro(dayjs('2026-06-15'))).toBeUndefined()
  })

  it.each([null, undefined])('omite quando não há data (%s)', (dia) => {
    expect(dataDoCadastro(dia)).toBeUndefined()
  })

  it('envia um dia diferente de hoje', () => {
    expect(dataDoCadastro(dayjs('2026-06-01'))).toBe('2026-06-01T13:30:45.000Z')
  })
})

describe('dataDaEdicao', () => {
  const original = '2026-05-20T12:00:00.000Z'

  it('omite quando o dia não mudou', () => {
    expect(dataDaEdicao(dayjs('2026-05-20'), original)).toBeUndefined()
  })

  it('omite quando não há data', () => {
    expect(dataDaEdicao(null, original)).toBeUndefined()
  })

  it('mantém o horário original ao mudar o dia', () => {
    expect(dataDaEdicao(dayjs('2026-05-21'), original)).toBe('2026-05-21T12:00:00.000Z')
  })

  it('usa a hora atual quando a data original é inválida', () => {
    expect(dataDaEdicao(dayjs('2026-05-21'), 'invalida')).toBe('2026-05-21T13:30:45.000Z')
  })
})

describe('datas "só dia"', () => {
  it('diaParaApi envia meio-dia local', () => {
    expect(diaParaApi(dayjs('2026-01-10'))).toBe('2026-01-10T15:00:00.000Z')
  })

  it('o dia enviado por diaParaApi volta igual em diaDaApi', () => {
    const enviado = diaParaApi(dayjs('2026-01-10'))
    expect(diaDaApi(enviado)?.format('YYYY-MM-DD')).toBe('2026-01-10')
  })

  it('data gravada à meia-noite UTC não volta como o dia anterior', () => {
    expect(formatarDia('2026-01-10T00:00:00.000Z')).toBe('10/01/2026')
  })

  it.each([null, undefined, '', 'invalida'])('diaDaApi devolve null para %s', (valor) => {
    expect(diaDaApi(valor)).toBeNull()
  })

  it('formatarDia mostra "-" sem data', () => {
    expect(formatarDia(null)).toBe('-')
  })

  it('diaDaSemana escreve por extenso', () => {
    expect(diaDaSemana('2026-06-16')).toBe('terça-feira')
    expect(diaDaSemana(null)).toBe('')
  })

  it('mesAbreviado devolve o mês em português', () => {
    expect(mesAbreviado('2026-02-10')).toBe('fev')
    expect(mesAbreviado(null)).toBe('')
  })
})

describe('rotuloMes', () => {
  it('formata AAAA-MM', () => {
    expect(rotuloMes('2026-06')).toBe('jun/26')
  })

  it.each(['2026-13', '2026-00', 'junho', ''])('devolve como veio: %s', (mes) => {
    expect(rotuloMes(mes)).toBe(mes)
  })
})

describe('textoHorario', () => {
  it('mostra o intervalo quando há fim', () => {
    expect(textoHorario('09:00', '16:00')).toBe('09:00 às 16:00')
  })

  it.each([null, undefined])('mostra só o início sem fim (%s)', (fim) => {
    expect(textoHorario('09:00', fim)).toBe('a partir das 09:00')
  })
})

describe('diasDesde', () => {
  it('conta dias de calendário, não períodos de 24 horas', () => {
    expect(diasDesde('2026-06-15T01:00:00')).toBe(0)
    expect(diasDesde('2026-06-14T23:59:00')).toBe(1)
    expect(diasDesde('2026-06-05T12:00:00')).toBe(10)
  })

  it('nunca fica negativo com data futura', () => {
    expect(diasDesde('2026-06-20T12:00:00')).toBe(0)
  })

  it('devolve 0 para data inválida', () => {
    expect(diasDesde('invalida')).toBe(0)
  })
})

describe('textoDiasDesde', () => {
  it.each([
    [0, 'hoje'],
    [1, 'há 1 dia'],
    [5, 'há 5 dias'],
  ])('%i -> %s', (dias, esperado) => {
    expect(textoDiasDesde(dias)).toBe(esperado)
  })
})
