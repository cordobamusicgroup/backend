# Etapa 1: Usar la imagen oficial de Bun
FROM oven/bun:1 AS base

# Establecer directorio de trabajo
WORKDIR /usr/src/app

# Etapa 2: Instalación de dependencias (con caché para acelerar compilaciones futuras)
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Instalar solo dependencias de producción (excluyendo devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Etapa 3: Preparación previa al lanzamiento
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules ./node_modules
COPY . .

# Generar cliente Prisma y construir la aplicación NestJS
ENV NODE_ENV=production
RUN bun prisma generate
RUN bun run build

# Etapa 4: Preparar el entorno para producción
FROM base AS release

# Establecer directorio de trabajo
WORKDIR /usr/src/app

# Copiar las dependencias de producción y los archivos necesarios desde las etapas anteriores
COPY --from=install /temp/prod/node_modules ./node_modules
COPY --from=prerelease /usr/src/app/dist ./dist
COPY --from=prerelease /usr/src/app/prisma ./prisma
COPY --from=prerelease /usr/src/app/package.json ./package.json

# Exponer el puerto 3000 que usa la aplicación
EXPOSE 3000/tcp

# Ejecutar migraciones Prisma y luego iniciar la aplicación de NestJS en modo producción
CMD ["sh", "-c", "bun prisma migrate deploy && bun run dist/main.js"]
