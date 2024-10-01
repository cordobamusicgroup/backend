# Stage 1: Build
FROM node:20-slim as base

# Install Bun globally
RUN npm install -g bun

# Set working directory
WORKDIR /app

# Copy configuration files
COPY package.json bun.lockb ./

# Install dependencies using Bun (Bun automatically creates a lockfile if not present)
RUN bun install --no-cache

# Copy the rest of the application files
COPY . .

# Generate Prisma client
RUN bun prisma generate

# Build the application
RUN bun run build

# Stage 2: Production
FROM node:20-slim as production

# Install Bun globally in the production stage
RUN npm install -g bun

# Set working directory
WORKDIR /app

# Copy dependencies and build files from the build stage
COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/dist /app/dist
COPY --from=base /app/package.json /app/package.json
COPY --from=base /app/bun.lockb /app/bun.lockb
COPY --from=base /app/prisma /app/prisma

# Set environment variable for production
ENV NODE_ENV=production

# Expose the port on which the application runs
EXPOSE 3000

# Run Prisma migrations and seed script before starting the application
CMD ["sh", "-c", "bun prisma migrate deploy && bun run start:prod"]
