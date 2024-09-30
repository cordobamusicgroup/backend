# Stage 1: Build
FROM node:20-slim AS base

# Install necessary system packages for Prisma and other dependencies (including OpenSSL)
# Cache system packages separately to avoid reinstalling them if they haven't changed
RUN apt-get update && apt-get install -y \
    openssl \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy configuration files
COPY package.json pnpm-lock.yaml ./ 

# Install dependencies and use cache for pnpm
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store pnpm install --frozen-lockfile

# Copy the rest of the application files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN pnpm run build

# Stage 2: Production
FROM node:20-slim AS production

# Install necessary system packages for Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm in the production stage as well
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy dependencies and build files from the build stage
COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/dist /app/dist
COPY --from=base /app/package.json /app/package.json
COPY --from=base /app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=base /app/prisma /app/prisma

# Set environment variable for production
ENV NODE_ENV=production

# Expose the port on which the application runs
EXPOSE 3000

# Run Prisma migrations and seed script before starting the application
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm run start:prod"]
