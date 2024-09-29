# Stage 1: Build
FROM oven/bun:alpine AS base

# Set working directory
WORKDIR /app

# Copy configuration files
COPY package.json bun.lockb ./ 

# Install dependencies using Bun
RUN bun install --frozen-lockfile

# Copy the rest of the application files
COPY . .

# Generate Prisma client using Bun
RUN bun prisma generate

# Build the application
RUN bun run build

# Stage 2: Production
FROM oven/bun:alpine AS production

# Set working directory
WORKDIR /app

# Copy dependencies and build files from the build stage
COPY --from=base /app /app

# Set environment variable for production
ENV NODE_ENV=production

# Expose the port on which the application runs
EXPOSE 3000

# Run Prisma migrations and seed script before starting the application
CMD ["sh", "-c", "bun prisma migrate deploy && bun run /app/prisma/seed.ts && bun run start:prod"]
