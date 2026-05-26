FROM node:20-alpine

# docker CLI needed for docker compose commands
RUN apk add --no-cache docker-cli docker-cli-compose git

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src/ ./src/

RUN mkdir -p /data /tmp/cubehost-repos

EXPOSE 4001 5000

CMD ["node", "src/index.js"]
