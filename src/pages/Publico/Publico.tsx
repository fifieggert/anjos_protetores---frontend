import { useEffect, useState } from 'react'
import { buscarEstatisticas } from '../../services/publico'
import type { EstatisticasPublicas } from '../../types/publico'
import ComoFunciona from './ComoFunciona'
import FaixaNumeros from './FaixaNumeros'
import Hero from './Hero'
import NavbarPublica from './NavbarPublica'
import Rodape from './Rodape'
import SecaoAnimais from './SecaoAnimais'
import SecaoDoacoes from './SecaoDoacoes'
import SecaoEventos from './SecaoEventos'
import SobreAbrigo from './SobreAbrigo'
import './publico.css'

const TITULO = 'Anjos Protetores — Encontre um novo melhor amigo'
const DESCRICAO =
  'Conheça os cães e gatos do abrigo Anjos Protetores que esperam por um lar, os próximos eventos e como ajudar com doações.'

// Ajusta título e meta description enquanto a página está aberta; ao sair, volta o que havia.
function useTituloEDescricao() {
  useEffect(() => {
    const tituloAnterior = document.title
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const criada = !meta
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    const descricaoAnterior = meta.content

    document.title = TITULO
    meta.content = DESCRICAO

    return () => {
      document.title = tituloAnterior
      if (criada) meta.remove()
      else meta.content = descricaoAnterior
    }
  }, [])
}

// Página inicial do site (rota "/"), sem login e sem o layout interno.
function Publico() {
  useTituloEDescricao()

  const [estatisticas, setEstatisticas] = useState<EstatisticasPublicas | null>(null)
  const [carregandoEstatisticas, setCarregandoEstatisticas] = useState(true)

  // Usadas pelo hero e pela faixa de números. Se falhar, as duas escondem os números.
  useEffect(() => {
    let ativo = true
    buscarEstatisticas()
      .then((dados) => {
        if (ativo) setEstatisticas(dados)
      })
      .catch(() => {
        if (ativo) setEstatisticas(null)
      })
      .finally(() => {
        if (ativo) setCarregandoEstatisticas(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  return (
    <div className="pub-pagina">
      <NavbarPublica />
      <main>
        <Hero animaisDisponiveis={estatisticas?.animaisDisponiveis ?? null} />
        <FaixaNumeros estatisticas={estatisticas} carregando={carregandoEstatisticas} />
        <SecaoEventos />
        <SecaoAnimais />
        <ComoFunciona />
        <SobreAbrigo />
        <SecaoDoacoes />
      </main>
      <Rodape />
    </div>
  )
}

export default Publico
