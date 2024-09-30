# Stage 1: Build dependencies and application
FROM node:18-slim AS base

# Install necessary system dependencies
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

# Install dependencies using pnpm with cache
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store pnpm install --frozen-lockfile

# Copy the rest of the project files
COPY . .

# Compile the application (uses tsconfig.build.json)
RUN pnpm run build

# Stage 2: Production
FROM node:18-slim AS production

# Set working directory
WORKDIR /app

# Copy dependencies and build artifacts from the build stage
COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/dist /app/dist
COPY --from=base /app/package.json /app/package.json

# Expose the port the application will run on
EXPOSE 3000

# Run Prisma migrations and start the application
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm run start:prod"]
