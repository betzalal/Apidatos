# 1. Cambiamos a Node 20 para cumplir con el requisito de better-sqlite3
FROM node:20-alpine

# 2. Instalamos herramientas de compilación necesarias para módulos nativos
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

COPY package*.json ./

# 3. Instalamos dependencias (omitimos devDependencies para que pese menos)
RUN npm install --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
