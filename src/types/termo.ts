// Termo de adoção (rotas só do ADMIN). Não traz dados do interessado: só o vínculo
// com a solicitação. Nome e telefone aparecem apenas no PDF.
export interface TermoAdocao {
  id: string
  animalId: string
  animal: { id: string; nome: string }
  solicitacaoId: string | null
  geradoPor: { id: string; nome: string }
  geradoEm: string
  assinado: boolean
  assinadoEm: string | null
}
