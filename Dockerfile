# Stage 1: Build
FROM node:20-slim AS base

RUN apt-get update -y && apt-get install -y openssl
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store pnpm install --frozen-lockfile
COPY . . 
RUN npx prisma generate
RUN pnpm run build

# Stage 2: Release
FROM base AS release
# Copy dependencies and build files from the build stage
COPY --from=install /app/node_modules /app/node_modules
COPY --from=install /app/dist /app/dist
COPY --from=install /app/package.json /app/package.json
COPY --from=install /app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=install /app/prisma /app/prisma

ENV NODE_ENV=production

EXPOSE 3000
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm run start:prod"]
