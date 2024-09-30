FROM node:18-alpine AS base

# Instala pnpm globalmente y openssl
RUN apk add --no-cache openssl && npm i -g pnpm

# Etapa de instalación de dependencias
FROM base AS dependencies

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Etapa de build
FROM base AS build

WORKDIR /app
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
RUN pnpm build
RUN pnpm prisma generate
RUN pnpm prune --prod

# Etapa de despliegue
FROM base AS deploy

WORKDIR /app
COPY --from=build /app/dist/ ./dist/
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

# Ejecuta las migraciones de Prisma y el seed compilado antes de iniciar la aplicación
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm start:prod"]
