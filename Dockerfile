# Base image
FROM node:20-slim AS base

# Install necessary system packages for Prisma and other dependencies (including OpenSSL)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Enable pnpm via Corepack
RUN corepack enable

# Set working directory
WORKDIR /app

# Copy configuration files
COPY package.json pnpm-lock.yaml ./

# Install dependencies and use cache for pnpm
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store pnpm install --frozen-lockfile

# Copy the rest of the application files
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build the application
RUN pnpm run build

# Set environment variable for production
ENV NODE_ENV=production

# Expose the port on which the application runs
EXPOSE 3000

# Run Prisma migrations and start the application
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm run start:prod"]
