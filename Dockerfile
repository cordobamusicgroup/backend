# Stage 1: Base stage for building the app and installing devDependencies
FROM node:20-slim AS build

# Install necessary system packages (like OpenSSL for Prisma)
RUN apt-get update && apt-get install -y \
    openssl \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files to install dependencies
COPY package.json pnpm-lock.yaml ./

# Install all dependencies, including devDependencies
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store pnpm install

# Copy the rest of the application files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN pnpm run build

# Stage 2: Production
FROM node:20-slim AS production

# Install necessary system packages (like OpenSSL for Prisma)
RUN apt-get update && apt-get install -y \
    openssl \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally in production
RUN npm install -g pnpm

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

# Run Prisma migrations and seed script before starting the application
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm prisma db seed && pnpm run start:prod"]
