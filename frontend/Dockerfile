# -------------------------
# Stage 1: Build React
# -------------------------
FROM node:18-alpine AS build
WORKDIR /app

# Install dependencies first for cache layer
COPY package*.json ./
RUN npm install

# Build static files (Takes .env.production variables)
COPY . .
RUN npm run build 

# -------------------------
# Stage 2: Serve via Nginx
# -------------------------
FROM nginx:alpine

# Custom Nginx Config to allow React-Router to work properly
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production bundled files from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
