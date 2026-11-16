# Anjos Protetores: interface web (frontend)

Interface web do **Anjos Protetores**, sistema de gestão de um abrigo de animais. Tem duas áreas: o **site público** (animais disponíveis, eventos, como adotar e contato) e o **sistema interno** da equipe (animais, doações e estoque, adoções, eventos, usuários e painel). Projeto da disciplina de Portfólio (Engenharia de Software, Católica SC).

- **Sistema em produção:** https://abrigoanjosprotetores.com.br
- **Backend (API):** https://github.com/fifieggert/anjos_protetores---backend
- **Documentação completa (Wiki):** aba *Wiki* deste repositório

## Stack

React 19 · TypeScript · Vite · Ant Design · React Router · Axios · Vitest e Testing Library. Em produção é servido por Nginx dentro de um container Docker, atrás do Caddy.

## Telas

| Rota | Tela | Acesso |
|---|---|---|
| `/` | Site público | Todos |
| `/login` | Login | Todos |
| `/dashboard` | Painel da coordenação | ADMIN |
| `/animais` | Cadastro e edição de animais, com foto | ADMIN e VOLUNTARIO |
| `/doacoes` | Doações, saídas e itens de estoque | ADMIN e VOLUNTARIO |
| `/adocoes` | Solicitações de adoção e termo em PDF | ADMIN |
| `/eventos` | Eventos do abrigo | ADMIN |
| `/usuarios` | Gestão de usuários | ADMIN |

O frontend esconde as telas por perfil, mas quem de fato bloqueia o acesso é a API.

## Estrutura

```
src/
  pages/        uma pasta por tela (Publico, Animais, Doacoes, Adocoes, Eventos, Usuarios, Dashboard, Login)
  components/   componentes compartilhados (layout, rota protegida, campo de imagem)
  services/     chamadas à API (um arquivo por recurso, sobre o Axios)
  contexts/     sessão do usuário (AuthContext)
  types/        tipos TypeScript
  utils/        funções auxiliares
  theme/        tema e cores
  __tests__/    testes
```

## Rodar localmente

Pré-requisitos: Node.js na versão do `.nvmrc` e a [API](https://github.com/fifieggert/anjos_protetores---backend) rodando em `http://localhost:4000`.

```bash
npm ci
cp .env.example .env     # ajuste se necessário
npm run dev              # http://localhost:5173
```

| Variável | Para que serve |
|---|---|
| `VITE_API_URL` | Endereço da API (`http://localhost:4000/api` em desenvolvimento; `/api` em produção) |
| `VITE_WHATSAPP_ABRIGO` | WhatsApp do abrigo, só dígitos com 55 e DDD. Sem ela, os botões de WhatsApp somem. É lida no **build**. |

Os dados de contato do rodapé (e-mail, endereço, redes sociais) ficam em `src/pages/Publico/dadosAbrigo.ts`.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Checa os tipos e gera `dist/` |
| `npm run lint` | oxlint |
| `npm test` | Testes |
| `npm run test:coverage` | Testes com cobertura (mínimo de 25% no CI) |
| `npx tsc -p tsconfig.test.json` | Checa os tipos dos testes |

## Testes

Vitest e Testing Library, na pasta `src/__tests__`. Só as bordas são falsas (Axios e services): nenhum teste acessa a rede nem lê o `.env`. O CI roda o lint, os testes com cobertura e o build, e envia a cobertura ao SonarCloud.

## Deploy

Merge na `main` dispara o workflow **Deploy**: constrói a imagem, envia ao ECR e atualiza a EC2 por SSM (a mesma infraestrutura do backend). Detalhes em [`docs/deploy-frontend.md`](docs/deploy-frontend.md).

## Autoria

Sophia Eggert Freire da Rocha, Engenharia de Software, Católica SC.
