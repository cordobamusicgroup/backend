# Etapa 1: Construcción
FROM node:20 AS build

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY package.json pnpm-lock.yaml ./

# Instalar pnpm
RUN npm install -g pnpm

# Instalar dependencias y usar caché para pnpm
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

# Copiar el resto de los archivos de la aplicación
COPY . .

# Generar el cliente Prisma
RUN pnpm prisma generate

# Construir la aplicación
RUN pnpm run build

# Etapa 2: Producción
FROM node:20-slim AS production

# Configurar el locale predeterminado
ENV LANG en_US.UTF-8

# Instalar Chrome y fuentes necesarias para Puppeteer
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
    && sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] https://dl-ssl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros fonts-kacst fonts-freefont-ttf libxss1 dbus dbus-x11 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Establecer la variable de entorno para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar dependencias y archivos de construcción desde la etapa de construcción
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/prisma /app/prisma

# Establecer la variable de entorno para producción
ENV NODE_ENV=production

# Exponer el puerto en el que corre la aplicación
EXPOSE 3000

# Ejecutar migraciones de Prisma antes de iniciar la aplicación
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm run start:prod"]
