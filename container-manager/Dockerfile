FROM node:20-alpine

# Build tools for native modules (better-sqlite3) + docker CLI + git
RUN apk add --no-cache python3 make g++ docker-cli docker-cli-compose git

# Activar pnpm via corepack (incluido en Node.js >= 16)
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY src/ ./src/

RUN mkdir -p /data /tmp/cubehost-repos

EXPOSE 4001 5000

CMD ["node", "src/index.js"]
