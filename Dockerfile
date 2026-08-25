# Multi-stage build para otimização de imagem (NodeJS + Express + Vite)
# --- Estágio 1: Build ---
FROM node:20-slim AS builder

WORKDIR /app

# Instala dependências básicas para compilação se necessário
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copia manifestos e instala dependências
COPY package*.json ./
RUN npm install

# Copia código fonte
COPY . .

# Executa compilação (Gera os arquivos estáticos na /dist e compila o server.ts com esbuild)
RUN npm run build

# --- Estágio 2: Execução ---
FROM node:20-slim

WORKDIR /app

# Define ambiente como produção
ENV NODE_ENV=production

# Copia os manifestos e instala apenas dependências de produção
COPY package*.json ./
RUN npm install --omit=dev

# Copia os arquivos compilados do estágio de build
COPY --from=builder /app/dist ./dist

# Expõe a porta interna da aplicação
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["npm", "run", "start"]

