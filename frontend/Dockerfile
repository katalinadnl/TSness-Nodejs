FROM node:20 AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ARG MODE=dev

RUN if [ "$MODE" = "prod" ]; then npm run build; fi

FROM nginx:1.25-alpine AS prod
COPY --from=base /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

FROM base AS dev
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
