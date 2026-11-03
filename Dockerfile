# syntax=docker/dockerfile:1

# Imagem de produção do frontend Anjos Protetores. Detalhes em docs/deploy-frontend.md.
#
# Duas etapas (multi-stage):
#   1. build: Node instala as dependências e gera os arquivos estáticos (pasta dist/).
#   2. final: só um servidor web (nginx) com o dist/. Node, código-fonte e node_modules
#      ficam de fora, então a imagem final é pequena e tem menos coisas para atacar.
#
# No servidor, o Caddy (HTTPS) fica na frente: "/" vem para este container (porta 8080) e
# "/api/*" vai para a API. Por isso aqui é só HTTP simples.

# Node: mesma versão do .nvmrc (o CI usa o .nvmrc).
ARG NODE_VERSION=24.22.1
# nginx: versão estável (números pares, 1.30.x), variante Alpine, já sem root.
ARG NGINX_VERSION=1.30.6-alpine

# ---- 1. build ----
# Debian slim (glibc): os binários nativos do Vite (rolldown, lightningcss) têm variante
# para glibc no package-lock.json, testada também no CI.
FROM node:${NODE_VERSION}-bookworm-slim AS build
WORKDIR /app

# Primeiro só os manifestos: a camada do "npm ci" fica em cache enquanto eles não mudarem.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Variáveis do Vite: entram no JavaScript NA HORA DO BUILD (não dá para mudar depois com
# "docker run -e"). Ficam depois do "npm ci" para trocar o valor não invalidar o cache.
# - VITE_API_URL: caminho da API. "/api" = mesmo domínio do site (sem CORS).
# - VITE_WHATSAPP_ABRIGO: número com 55 e DDD; vazio esconde os botões de WhatsApp.
#   Não é segredo: aparece na página pública.
ARG VITE_API_URL=/api
ARG VITE_WHATSAPP_ABRIGO=
ENV VITE_API_URL=${VITE_API_URL} \
    VITE_WHATSAPP_ABRIGO=${VITE_WHATSAPP_ABRIGO}

# tsc (checagem de tipos) + vite build -> /app/dist
RUN npm run build

# ---- 2. final ----
# Imagem oficial do nginx que já roda como o usuário "nginx" (UID 101, sem root) e
# escuta na porta 8080 (portas abaixo de 1024 exigiriam root).
FROM nginxinc/nginx-unprivileged:${NGINX_VERSION} AS final

# Configuração do site (substitui a padrão) e headers de segurança.
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/cabecalhos-seguranca.conf /etc/nginx/snippets/cabecalhos-seguranca.conf

# Arquivos do site. Pertencem ao root e o nginx só lê.
COPY --from=build /app/dist /usr/share/nginx/html

# Deixa explícito: o processo roda como usuário comum.
USER nginx
EXPOSE 8080

# O Docker marca o container como "unhealthy" se o /health parar de responder.
# (wget vem no Alpine; curl não.)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
