import { AxiosError, AxiosHeaders } from 'axios'
import type { AxiosAdapter, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { vi } from 'vitest'

// Troca só o adapter (a parte do axios que faz a chamada HTTP): URL, headers, interceptores e
// tratamento de erro continuam reais, e nada sai para a rede.
export function mockarAdapter(instancia: AxiosInstance) {
  const adapter = vi.fn<AxiosAdapter>()
  instancia.defaults.adapter = adapter
  return adapter
}

function resposta(config: InternalAxiosRequestConfig, status: number, data: unknown): AxiosResponse {
  return { data, status, statusText: String(status), headers: new AxiosHeaders(), config }
}

export function respondeOk(data: unknown = null, status = 200): AxiosAdapter {
  return (config) => Promise.resolve(resposta(config, status, data))
}

export function respondeErro(status: number, data: unknown = null): AxiosAdapter {
  return (config) =>
    Promise.reject(new AxiosError(`Erro ${status}`, 'ERR_BAD_RESPONSE', config, null, resposta(config, status, data)))
}

// Sem response: o servidor não respondeu.
export function falhaDeRede(): AxiosAdapter {
  return (config) => Promise.reject(new AxiosError('Network Error', 'ERR_NETWORK', config))
}

// Erro no formato do axios, para testar funções que só recebem o erro.
export function erroAxios(status?: number, data: unknown = null) {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig
  return new AxiosError(
    'Erro',
    status ? 'ERR_BAD_RESPONSE' : 'ERR_NETWORK',
    config,
    null,
    status ? resposta(config, status, data) : undefined,
  )
}

// Config da enésima chamada ao adapter, com o corpo já como objeto.
export function chamada(adapter: ReturnType<typeof mockarAdapter>, indice = 0) {
  const config = adapter.mock.calls[indice]?.[0]
  if (!config) throw new Error(`O adapter não recebeu a chamada ${indice}.`)
  const corpo: unknown = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
  return {
    metodo: config.method,
    url: config.url,
    corpo,
    params: config.params as unknown,
    responseType: config.responseType,
    autorizacao: config.headers.get('Authorization'),
  }
}
