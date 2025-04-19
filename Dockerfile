# 🐳 Base image
FROM node:23-slim AS base

# 🛠️ Instalar paquetes necesarios para Prisma, bcrypt, y unzip
RUN apt-get update -y && apt-get install -y \
    openssl \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# 📦 Habilitar y activar pnpm desde corepack (usará la versión definida en package.json)
RUN corepack enable && corepack prepare pnpm --activate

# 🗂️ Establecer directorio de trabajo
WORKDIR /app

# 🔐 Habilitar scripts postinstall (prisma, bcrypt, etc.)
ENV PNPM_ENABLE_PRE_POST_SCRIPTS=true

# 📄 Copiar archivos de dependencias primero para aprovechar caché
COPY package.json pnpm-lock.yaml ./

# 📦 Instalar dependencias con caché montado
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store pnpm install

# 📁 Copiar el resto del código fuente
COPY . .

# ⚙️ Generar Prisma client
RUN pnpm prisma generate

# 🏗️ Build de la app
RUN pnpm run build

# 🚪 Exponer puerto de ejecución
EXPOSE 3000

# 🚀 Comando final: aplicar migraciones y arrancar
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm run start:prod"]
