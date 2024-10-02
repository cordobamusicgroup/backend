# Stage 1: Build
FROM node:20-slim AS base
WORKDIR /app

# Install pnpm globally and OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy node_modules and project files into the image
FROM base AS prerelease
COPY --from=install /app/node_modules /app/node_modules
COPY . . 
ENV NODE_ENV=production
RUN pnpx prisma generate
RUN pnpm run build

# Stage 2: Release
FROM base AS release
# Copy dependencies and build files from the build stage
COPY --from=install /app/node_modules /app/node_modules
COPY --from=prerelease /app/dist /app/dist
COPY --from=prerelease /app/package.json /app/package.json
COPY --from=prerelease /app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=prerelease /app/prisma /app/prisma

USER node
EXPOSE 3000
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm run start:prod"]
