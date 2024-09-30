# Stage 1: Base setup with pnpm
FROM node:20-slim AS base

# Set environment variables for pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Enable corepack to manage pnpm
RUN corepack enable

# Set working directory
WORKDIR /app

# Copy all files into the container
COPY . /app

# Stage 2: Install production dependencies
FROM base AS prod-deps

# Use cache to store pnpm dependencies and install only production dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# Stage 3: Build the application
FROM base AS build

# Use cache and install all dependencies including dev dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Build the application
RUN pnpm run build

# Stage 4: Final production stage
FROM node:20-slim AS final

# Set environment variables for pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Set working directory
WORKDIR /app

# Copy necessary files from previous stages
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/pnpm-lock.yaml /app/pnpm-lock.yaml

# Expose port
EXPOSE 8000

# Command to run Prisma migrations and start the application in production mode
CMD [ "sh", "-c", "pnpm prisma migrate deploy && pnpm run start:prod" ]
