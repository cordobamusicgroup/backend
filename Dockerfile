# Etapa 1: Usar la imagen oficial de Node.js
FROM node:20-slim AS base

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Establecer el directorio de trabajo
WORKDIR /usr/src/app

# Etapa 2: Instalación de dependencias con caché de pnpm
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json pnpm-lock.yaml /temp/dev/

# Usar la caché de pnpm
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store cd /temp/dev && pnpm install

# Etapa 3: Preparación previa al lanzamiento
FROM base AS prerelease
# Copiar node_modules y archivos de la etapa anterior
COPY --from=install /temp/dev/node_modules ./node_modules
COPY . .

# Generar cliente Prisma y construir la aplicación NestJS
ENV NODE_ENV=production
RUN pnpm prisma generate
RUN pnpm run build

# Etapa 4: Preparar el entorno para producción
FROM base AS release

# Establecer directorio de trabajo
WORKDIR /usr/src/app

# Copiar las dependencias de producción y los archivos necesarios desde las etapas anteriores
COPY --from=install /temp/dev/node_modules ./node_modules
COPY --from=prerelease /usr/src/app/dist ./dist
COPY --from=prerelease /usr/src/app/prisma ./prisma
COPY --from=prerelease /usr/src/app/package.json ./package.json
COPY --from=prerelease /usr/src/app/pnpm-lock.yaml ./pnpm-lock.yaml

# Exponer el puerto 3000 que usa la aplicación
EXPOSE 6060

# Ejecutar migraciones Prisma y luego iniciar la aplicación de NestJS en modo producción
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm run start:prod"]
