FROM node:20-alpine

# Build tools for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src/ ./src/

RUN mkdir -p /data

EXPOSE 4000

CMD ["node", "src/index.js"]
