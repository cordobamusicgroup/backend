# Stage 1: Build
FROM oven/bun:1 AS base
WORKDIR /app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /app/node_modules /app/node_modules
COPY . .
ENV NODE_ENV=production
RUN bun prisma generate
RUN bun run build


FROM base AS release
# Copy dependencies and build files from the build stage
COPY --from=install /app/node_modules /app/node_modules
COPY --from=prerelease /app/dist /app/dist
COPY --from=prerelease /app/package.json /app/package.json
COPY --from=prerelease /app/bun.lockb /app/bun.lockb
COPY --from=prerelease /app/prisma /app/prisma

USER bun
EXPOSE 3000
CMD ["sh", "-c", "bun prisma migrate deploy && bun run start:prod"]
