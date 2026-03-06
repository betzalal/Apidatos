FROM node:18-alpine
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production

COPY . .

# Exponer el puerto del Backend Node
EXPOSE 3000

# Arrancar el servidor
CMD [ "node", "server.js" ]
