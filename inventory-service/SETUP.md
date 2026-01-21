# Inventory Service - Documentación Completa

Microservicio de inventario para gestión de stock y procesamiento de pedidos mediante mensajería asíncrona con RabbitMQ.

## 📋 Descripción

Este servicio es responsable de:
- Gestionar el inventario de productos (stock disponible y reservado)
- Consumir eventos `OrderCreated` desde RabbitMQ
- Validar disponibilidad de stock
- Reservar stock cuando hay disponibilidad
- Publicar eventos `StockReserved` o `StockRejected`

## 🏗️ Arquitectura

El servicio implementa:
- **NestJS** como framework principal
- **TypeORM** para persistencia de datos con PostgreSQL
- **RabbitMQ** para mensajería asíncrona
- **Swagger** para documentación de API
- **Class-validator** para validación de DTOs

### Flujo de Eventos

```
Order Service → [OrderCreated] → Inventory Service
                                       ↓
                              Valida Stock
                                       ↓
                         ┌─────────────┴─────────────┐
                         ↓                           ↓
                  [StockReserved]            [StockRejected]
                         ↓                           ↓
                  Order Service              Order Service
```

## 🚀 Instalación

### Prerrequisitos

- Node.js 20+
- pnpm
- Docker y Docker Compose

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar variables de entorno

Copiar el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

### 3. Iniciar servicios de infraestructura

```bash
docker-compose up -d
```

Esto iniciará:
- PostgreSQL en puerto `5432`
- RabbitMQ en puerto `5672` (AMQP) y `15672` (Management UI)

### 4. Iniciar el servicio

```bash
# Modo desarrollo
pnpm run start:dev

# Modo producción
pnpm run build
pnpm run start:prod
```

## 📡 API Endpoints

### Base URL
```
http://localhost:3001
```

### Swagger Documentation
```
http://localhost:3001/api/docs
```

### Endpoints principales

#### 1. Consultar stock de un producto
```http
GET /api/v1/products/{productId}/stock
```

**Ejemplo de respuesta:**
```json
{
  "productId": "a3c2b1d0-6b0e-4f2b-9c1a-2d3f4a5b6c7d",
  "availableStock": 25,
  "reservedStock": 3,
  "updatedAt": "2026-01-21T15:08:10Z"
}
```

#### 2. Crear stock para un producto
```http
POST /api/v1/products/stock
```

**Body:**
```json
{
  "productId": "a3c2b1d0-6b0e-4f2b-9c1a-2d3f4a5b6c7d",
  "availableStock": 100,
  "reservedStock": 0
}
```

#### 3. Listar todos los stocks
```http
GET /api/v1/products/stock/all
```

## 🔄 Eventos RabbitMQ

### Eventos Consumidos

#### OrderCreated
**Queue:** `order_to_inventory_queue`  
**Routing Key:** `order.created`

```json
{
  "eventType": "OrderCreated",
  "orderId": "0d3f6b7c-9a8e-4c12-8f67-5e0c2a1b9d34",
  "correlationId": "correlation-123",
  "createdAt": "2026-01-21T15:09:45Z",
  "items": [
    {
      "productId": "a3c2b1d0-6b0e-4f2b-9c1a-2d3f4a5b6c7d",
      "quantity": 2
    }
  ]
}
```

### Eventos Publicados

#### StockReserved
**Queue:** `inventory_to_order_queue`  
**Routing Key:** `stock.reserved`

```json
{
  "eventType": "StockReserved",
  "orderId": "0d3f6b7c-9a8e-4c12-8f67-5e0c2a1b9d34",
  "correlationId": "correlation-123",
  "reservedItems": [
    {
      "productId": "a3c2b1d0-6b0e-4f2b-9c1a-2d3f4a5b6c7d",
      "quantity": 2
    }
  ],
  "reservedAt": "2026-01-21T15:10:00Z"
}
```

#### StockRejected
**Queue:** `inventory_to_order_queue`  
**Routing Key:** `stock.rejected`

```json
{
  "eventType": "StockRejected",
  "orderId": "0d3f6b7c-9a8e-4c12-8f67-5e0c2a1b9d34",
  "correlationId": "correlation-123",
  "reason": "Insufficient stock for product a3c2b1d0-6b0e-4f2b-9c1a-2d3f4a5b6c7d",
  "rejectedAt": "2026-01-21T15:10:00Z"
}
```

## 🗄️ Base de Datos

### Modelo de Datos

#### products_stock

| Campo | Tipo | Descripción |
|-------|------|-------------|
| productId | UUID (PK) | ID único del producto |
| availableStock | INTEGER | Stock disponible |
| reservedStock | INTEGER | Stock reservado |
| updatedAt | TIMESTAMP | Última actualización |

### Operaciones de Stock

El servicio implementa:
- **Validación de stock:** Verifica disponibilidad sin modificar datos
- **Reserva de stock:** Usa transacciones con locks pesimistas para prevenir race conditions
- **Actualización atómica:** Decrementa `availableStock` y incrementa `reservedStock` en una sola transacción

## 🔧 Configuración

### Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| NODE_ENV | Entorno de ejecución | development |
| PORT | Puerto del servidor HTTP | 3001 |
| DB_HOST | Host de PostgreSQL | localhost |
| DB_PORT | Puerto de PostgreSQL | 5432 |
| DB_USERNAME | Usuario de la BD | postgres |
| DB_PASSWORD | Contraseña de la BD | postgres |
| DB_DATABASE | Nombre de la BD | inventory_db |
| RABBITMQ_URL | URL de conexión a RabbitMQ | amqp://localhost:5672 |

## 🧪 Testing

```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

## 📦 Docker

### Construir imagen

```bash
docker build -t inventory-service .
```

### Ejecutar con Docker Compose

```bash
docker-compose up -d
```

## 🔍 Monitoreo

### RabbitMQ Management UI
```
http://localhost:15672
```
- **Usuario:** guest
- **Contraseña:** guest

### Logs

```bash
# Ver logs en desarrollo
pnpm run start:dev

# Ver logs de Docker
docker-compose logs -f
```

## 🏛️ Principios y Buenas Prácticas

### Arquitectura
- **Separación de responsabilidades:** Controllers, Services, Repositories
- **Dependency Injection:** Uso de DI de NestJS
- **DTOs:** Validación y transformación de datos
- **Entities:** Representación de modelos de datos

### Mensajería
- **Idempotencia:** Los eventos pueden procesarse múltiples veces sin efectos adversos
- **ACK Manual:** Confirmación explícita de mensajes procesados
- **Manejo de errores:** Publicación de eventos de rechazo en caso de fallo

### Base de Datos
- **Transacciones:** Para operaciones críticas de stock
- **Locks Pesimistas:** Para prevenir race conditions
- **Timestamps:** Auditoría automática de cambios

## 📝 Estructura del Proyecto

```
src/
├── messaging/           # Eventos y consumers de RabbitMQ
│   ├── events/         # Definición de eventos
│   ├── interfaces/     # Interfaces de eventos
│   ├── order-events.consumer.ts
│   └── rabbitmq.service.ts
├── products/           # Módulo de productos
│   ├── dto/           # DTOs de request/response
│   ├── entities/      # Entidades de TypeORM
│   ├── interfaces/    # Interfaces de dominio
│   ├── products.controller.ts
│   ├── products.service.ts
│   └── product-stock.service.ts
├── rabbitmq/          # Módulo de configuración RabbitMQ
│   └── rabbitmq.module.ts
├── app.module.ts
└── main.ts
```

## 🤝 Integración con Order Service

Este servicio debe integrarse con el Order Service:

1. Order Service publica `OrderCreated` → `order_to_inventory_queue`
2. Inventory Service consume y procesa
3. Inventory Service publica `StockReserved` o `StockRejected` → `inventory_to_order_queue`
4. Order Service consume y actualiza estado del pedido
