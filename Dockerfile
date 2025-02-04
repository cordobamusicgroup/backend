# Base image
FROM node:20-slim AS base

# Install necessary system packages for Prisma and other dependencies (including OpenSSL)
RUN apt-get update -y && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

# Instalar bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Enable pnpm via Corepack
RUN corepack enable

# Set working directory
WORKDIR /app

# Copy configuration files
COPY package.json bun.lockb* ./

# Install dependencies and use cache for bun
RUN --mount=type=cache,id=bun-cache,target=/root/.bun bun install

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
