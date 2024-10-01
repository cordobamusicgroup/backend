# Stage 1: Build
FROM oven/bun:latest as base

# Set working directory
WORKDIR /app

# Copy configuration files
COPY package.json bun.lockb ./

# Cache installation dependencies to avoid reinstalling them
RUN --mount=type=cache,target=/root/.bun bun install --no-save

# Copy the rest of the application files
COPY . .

# Generate Prisma client
RUN bun prisma generate

# Build the application
RUN bun run build

# Stage 2: Production
FROM oven/bun:latest as production

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
