# Etapa base
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Copiar el código fuente
COPY . /app
WORKDIR /app

# Instalar dependencias de producción
FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# Instalar todas las dependencias y construir la aplicación
FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm prisma generate
RUN pnpm run build

# Imagen final de producción
FROM node:20-slim AS production

# Instalar pnpm y Puppeteer
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxrandr2 \
    libgbm1 \
    libpangocairo-1.0-0 \
    libasound2 \
    fonts-liberation \
    libjpeg-turbo-progs \
    libxdamage1 \
    && rm -rf /var/lib/apt/lists/*

# Instalar Chrome mediante Puppeteer
RUN npx puppeteer browsers install chrome

# Establecer la variable de entorno para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Copiar dependencias y build desde las etapas anteriores
WORKDIR /app
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/prisma /app/prisma

# Establecer la variable de entorno para producción
ENV NODE_ENV=production

# Exponer el puerto en el que corre la aplicación
EXPOSE 3000

# Ejecutar migraciones de Prisma antes de iniciar la aplicación
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm run start:prod"]
