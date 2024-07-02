# Etapa 1: Construcción
FROM node:18 AS build

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY package.json pnpm-lock.yaml ./

# Instalar pnpm
RUN npm install -g pnpm

# Instalar dependencias
RUN pnpm install

# Copiar el resto de los archivos de la aplicación
COPY . .

# Generar el cliente Prisma
RUN pnpm prisma generate

# Construir la aplicación
RUN pnpm run build

# Etapa 2: Producción
FROM node:18-alpine AS production

# Establecer directorio de trabajo
WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar dependencias instaladas y el directorio de construcción desde la etapa de construcción
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=build /app/prisma ./prisma

# Establecer la variable de entorno para producción
ENV NODE_ENV=production

# Exponer el puerto en el que corre la aplicación
EXPOSE 3000

# Ejecutar migraciones de Prisma antes de iniciar la aplicación
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm run start:prod"]
