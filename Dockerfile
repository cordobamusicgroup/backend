# Base image
FROM node:20-slim AS base

# Install necessary system packages for Prisma and other dependencies (including OpenSSL and unzip)
RUN apt-get update -y && apt-get install -y openssl curl unzip && rm -rf /var/lib/apt/lists/*

# Instalar bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"
# Añadir variable para cache separado de bun
ENV BUN_CACHE_DIR="/root/.bun_cache"

# Enable pnpm via Corepack
RUN corepack enable

# Set working directory
WORKDIR /app

# Copy configuration files
COPY package.json bun.lockb* ./

# Instalar dependencias usando cache para bun en un directorio separado
RUN --mount=type=cache,id=bun-cache,target=/root/.bun_cache bun install

# Copy the rest of the application files
COPY . .

# Generate Prisma client
RUN bun prisma generate

# Build the application
RUN bun run build

# Set environment variable for production
ENV NODE_ENV=production

# Expose the port on which the application runs
EXPOSE 3000

# Run Prisma migrations and start the application
CMD ["sh", "-c", "bun prisma migrate deploy && bun run start:prod"]
