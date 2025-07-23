FROM node:20 AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ARG MODE=dev

RUN if [ "$MODE" = "prod" ]; then npm run build; fi

FROM base AS prod
EXPOSE 5000
CMD ["node", "dist/server.js"]

FROM base AS dev
EXPOSE 5000
CMD ["npm", "run", "dev"]
