# Etapa 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar el código fuente
COPY . .

# Construir la aplicación
RUN pnpm run build

# Etapa 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Instalar pnpm en runtime
RUN npm install -g pnpm

# Copiar package.json y pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Instalar solo dependencias de producción
RUN pnpm install --frozen-lockfile --prod

# Copiar la aplicación construida desde la etapa de build
COPY --from=build /app/dist ./dist

# Exponer el puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV DB_HOST=db-secondary
ENV DB_PORT=5432
ENV DB_USERNAME=admin
ENV DB_PASSWORD=password123
ENV DB_DATABASE=inventory_db
ENV RABBITMQ_HOST=rabbitmq
ENV RABBITMQ_PORT=5672
ENV RABBITMQ_USERNAME=admin
ENV RABBITMQ_PASSWORD=admin

# Comando para ejecutar la aplicación
CMD ["node", "dist/main.js"]
