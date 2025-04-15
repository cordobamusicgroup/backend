# Base image
FROM node:20-slim AS base

# Install necessary system packages for Prisma and other dependencies (including OpenSSL and unzip)
RUN apt-get update -y && apt-get install -y openssl curl unzip && rm -rf /var/lib/apt/lists/*

# Enable pnpm via Corepack
RUN corepack enable
# Install pnpm v10 using corepack sin errores
RUN SHA_SUM=$(npm view pnpm@10.1.0 dist.shasum) && corepack install -g pnpm@10.1.0+sha1.$SHA_SUM

# Set working directory
WORKDIR /app

# Copy configuration files
COPY package.json bun.lockb* ./

# ✅ Permitir scripts postinstall (bcrypt, prisma, etc.)
RUN pnpm config set enable-pre-post-scripts true

# Instalar dependencias usando pnpm con cache
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store pnpm install

# Copy the rest of the application files
COPY . .

# Generate Prisma client using pnpm
RUN pnpm prisma generate

# Build the application using pnpm
RUN pnpm run build

# Set environment variable for production
ENV NODE_ENV=production

# Expose the port on which the application runs
EXPOSE 3000

# Run Prisma migrations and start the application using pnpm
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm run start:prod"]
