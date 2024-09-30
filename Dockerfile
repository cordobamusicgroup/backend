# Stage 1: Base stage for installing system dependencies and pnpm
FROM node:20-slim AS base

# Install necessary system packages (OpenSSL, wget, gnupg)
RUN apt-get update && apt-get install -y \
    openssl \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Stage 2: Build the application
FROM base AS build

# Copy package files first to utilize Docker layer caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm with cache
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store pnpm install --frozen-lockfile

# Copy the entire project after installing dependencies
COPY . .

# Generate Prisma client and build the application
RUN pnpm prisma generate && pnpm run build

# Stage 3: Production
FROM base AS production

# Set working directory
WORKDIR /app

# Copy dependencies and build files from the build stage
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=build /app/prisma /app/prisma

# Set environment variable for production
ENV NODE_ENV=production

# Expose the port on which the application runs
EXPOSE 3000

# Run Prisma migrations and seeding before starting the application
CMD ["sh", "-c", "pnpm prisma migrate deploy && ts-node prisma/seed.ts && pnpm run start:prod"]
