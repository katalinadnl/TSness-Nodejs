FROM node:20 AS builder
WORKDIR /app

# On déclare l'argument venant de docker-compose
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

COPY package*.json ./
RUN npm install

# Copie du code et du fichier .env
COPY . .

# Build en injectant la variable
RUN npm run build

# Image finale Nginx
FROM nginx:1.25-alpine AS prod
WORKDIR /usr/share/nginx/html

COPY --from=builder /app/dist ./

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

