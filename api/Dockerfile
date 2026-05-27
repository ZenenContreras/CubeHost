FROM node:20-alpine

# Build tools for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Activar pnpm via corepack (incluido en Node.js >= 16)
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY src/ ./src/

RUN mkdir -p /data

EXPOSE 4000

CMD ["node", "src/index.js"]
