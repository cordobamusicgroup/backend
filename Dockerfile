# Stage 1: Build
FROM node:20-slim AS base

# Set working directory
WORKDIR /app

# Install necessary system packages for Prisma and other dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Copy the package.json and lock file
COPY package.json package-lock.json ./

# Install dependencies with npm
RUN npm install

# Install Bun globally
RUN npm install -g bun

# Copy the rest of the application files
COPY . .

# Generate Prisma client using Bun
RUN bun prisma generate

# Build the application (using Nest.js build process)
RUN npm run build

# Stage 2: Production
FROM node:20-slim AS production

# Install Bun in the production stage
RUN npm install -g bun

# Set working directory
WORKDIR /app

# Copy dependencies and build files from the build stage
COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/dist /app/dist
COPY --from=base /app/package.json /app/package.json
COPY --from=base /app/prisma /app/prisma

# Set environment variable for production
ENV NODE_ENV=production

# Expose the port on which the application runs
EXPOSE 3000

# Run Prisma migrations and start the application using Bun
CMD ["sh", "-c", "bun prisma migrate deploy && bun run dist/main.js"]
