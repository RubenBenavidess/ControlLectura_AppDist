# Sistema de Microservicios - Order & Inventory

Sistema de gestión de pedidos e inventario basado en microservicios con arquitectura orientada a eventos usando RabbitMQ.

## � Inicio Rápido

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd ControlLectura_AppDist

# 2. Levantar todos los servicios
sudo docker-compose up --build

# 3. Esperar a que todos los servicios estén listos (30-60 segundos)
# Verificar que estén corriendo
sudo docker-compose ps

# 4. Crear stock de productos (Inventory Service)
curl -X POST http://localhost:3000/api/v1/products/stock \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "a3c2b1d0-6b0e-4f2b-9c1a-2d3f4a5b6c7d",
    "productName": "Laptop Dell XPS 15",
    "availableQuantity": 50,
    "reservedQuantity": 0
  }'

# 5. Crear un pedido (Order Service)
curl -X POST http://localhost:8081/order-service/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-001",
    "items": [
      {
        "productId": "a3c2b1d0-6b0e-4f2b-9c1a-2d3f4a5b6c7d",
        "productName": "Laptop Dell XPS 15",
        "quantity": 2,
        "price": 1500.00
      }
    ]
  }'

# 6. Verificar el estado del pedido (el ID se obtiene de la respuesta anterior)
curl -X GET http://localhost:8081/order-service/api/orders/{orderId}

# 7. Ver logs en tiempo real
sudo docker-compose logs -f

# 8. Detener todos los servicios
sudo docker-compose down

# 9. Limpiar todo (incluyendo datos de BD)
sudo docker-compose down -v
```

## �📋 Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnologías)
- [Prerequisitos](#prerequisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Casos de Prueba](#casos-de-prueba)
- [Endpoints](#endpoints)

## 🏗️ Arquitectura

El sistema está compuesto por dos microservicios principales:

1. **Order Service** (Puerto 8081): Gestiona la creación y consulta de pedidos
2. **Inventory Service** (Puerto 3000): Gestiona el inventario y stock de productos

### Componentes de Infraestructura:

- **PostgreSQL (db-primary)**: Base de datos del Order Service (Puerto 5432)
- **PostgreSQL (db-secondary)**: Base de datos del Inventory Service (Puerto 5433)
- **RabbitMQ**: Message broker para comunicación asíncrona entre servicios
  - Puerto AMQP: 5672
  - Puerto Management UI: 15672

### Flujo de Comunicación:

```mermaid
graph LR
    A[Cliente] -->|HTTP POST| B[Order Service :8081]
    B -->|Publica Evento| C[RabbitMQ :5672]
    C -->|Consume Evento| D[Inventory Service :3000]
    B -->|Lee/Escribe| E[(PostgreSQL<br/>db-primary :5432<br/>order_db)]
    D -->|Lee/Escribe| F[(PostgreSQL<br/>db-secondary :5433<br/>inventory_db)]
    D -->|Publica Respuesta| C
    C -->|Consume Respuesta| B
    
    style A fill:#e1f5ff
    style B fill:#ffe1e1
    style C fill:#fff4e1
    style D fill:#e1ffe1
    style E fill:#f0e1ff
    style F fill:#f0e1ff
```

## 🛠️ Tecnologías

### Order Service
- Java 21
- Spring Boot 4.0.1
- Spring Data JPA
- PostgreSQL
- RabbitMQ
- Maven

### Inventory Service
- Node.js 20
- NestJS
- TypeORM
- PostgreSQL
- RabbitMQ
- pnpm

## 📦 Prerequisitos

Antes de comenzar, asegúrate de tener instalado:

- [Docker](https://docs.docker.com/get-docker/) (versión 20.10 o superior)
- [Docker Compose](https://docs.docker.com/compose/install/) (versión 2.0 o superior)
- Git

## 🚀 Instalación

### Opción 1: Usando Docker Compose (Recomendado)

#### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd ControlLectura_AppDist
```

#### 2. Construir y levantar todos los servicios

```bash
docker-compose up --build
```

Este comando:
- Construye las imágenes Docker de ambos microservicios
- Inicia las bases de datos PostgreSQL
- Inicia RabbitMQ
- Levanta los microservicios
- Configura la red entre contenedores

#### 3. Verificar que todos los servicios estén corriendo

```bash
docker-compose ps
```

Deberías ver 5 contenedores en estado "Up":
- `postgres_primary`
- `postgres_secondary`
- `rabbitmq_server`
- `order_service`
- `inventory_service`

#### 4. Ver los logs de los servicios

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f order-service
docker-compose logs -f inventory-service
```

#### 5. Detener los servicios

```bash
# Detener sin eliminar volúmenes
docker-compose down

# Detener y eliminar volúmenes (limpieza completa)
docker-compose down -v
```

### Opción 2: Desarrollo Local

#### Order Service (Java/Spring Boot)

```bash
cd order_service

# Asegurarse de tener las bases de datos y RabbitMQ corriendo
docker-compose up db-primary rabbitmq -d

# Compilar y ejecutar
./mvnw clean install
./mvnw spring-boot:run
```

#### Inventory Service (Node.js/NestJS)

```bash
cd inventory-service

# Asegurarse de tener las bases de datos y RabbitMQ corriendo
docker-compose up db-secondary rabbitmq -d

# Instalar dependencias
pnpm install

# Modo desarrollo
pnpm run start:dev

# Modo producción
pnpm run build
pnpm run start:prod
```

## ⚙️ Configuración

### Variables de Entorno

#### Order Service

| Variable | Valor por Defecto | Descripción |
|----------|------------------|-------------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://db-primary:5432/order_db` | URL de conexión a PostgreSQL |
| `SPRING_DATASOURCE_USERNAME` | `admin` | Usuario de base de datos |
| `SPRING_DATASOURCE_PASSWORD` | `password123` | Contraseña de base de datos |
| `SPRING_RABBITMQ_HOST` | `rabbitmq` | Host de RabbitMQ |
| `SPRING_RABBITMQ_PORT` | `5672` | Puerto de RabbitMQ |
| `SPRING_RABBITMQ_USERNAME` | `admin` | Usuario de RabbitMQ |
| `SPRING_RABBITMQ_PASSWORD` | `admin` | Contraseña de RabbitMQ |

#### Inventory Service

| Variable | Valor por Defecto | Descripción |
|----------|------------------|-------------|
| `NODE_ENV` | `development` | Entorno de ejecución (debe ser `development` para que TypeORM cree las tablas automáticamente) |
| `DB_HOST` | `db-secondary` | Host de PostgreSQL |
| `DB_PORT` | `5432` | Puerto de PostgreSQL |
| `DB_USERNAME` | `admin` | Usuario de base de datos |
| `DB_PASSWORD` | `password123` | Contraseña de base de datos |
| `DB_DATABASE` | `inventory_db` | Nombre de la base de datos |
| `RABBITMQ_URL` | `amqp://admin:admin@rabbitmq:5672` | URL completa de conexión a RabbitMQ |
| `RABBITMQ_HOST` | `rabbitmq` | Host de RabbitMQ |
| `RABBITMQ_PORT` | `5672` | Puerto de RabbitMQ |
| `RABBITMQ_USERNAME` | `admin` | Usuario de RabbitMQ |
| `RABBITMQ_PASSWORD` | `admin` | Contraseña de RabbitMQ |

### Puertos Expuestos

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| Order Service | 8081 | API REST del servicio de pedidos |
| Inventory Service | 3000 | API REST del servicio de inventario (puerto host:contenedor = 3000:3001) |
| PostgreSQL (Order) | 5432 | Base de datos de pedidos |
| PostgreSQL (Inventory) | 5433 | Base de datos de inventario (puerto host 5433 apunta al puerto 5432 del contenedor) |
| RabbitMQ AMQP | 5672 | Protocolo de mensajería |
| RabbitMQ Management | 15672 | Interfaz web de administración |

### Acceso a Interfaces Web

- **RabbitMQ Management**: http://localhost:15672
  - Usuario: `admin`
  - Contraseña: `admin`

- **Swagger UI (Inventory Service)**: http://localhost:3000/api/docs

## 🧪 Casos de Prueba

### Preparación: Crear Productos en Inventario

Antes de crear pedidos, necesitas tener productos con stock disponible en el inventario.

#### 1. Crear Stock de Productos

```bash
# Producto 1: Laptop
curl -X POST http://localhost:3000/api/v1/products/stock \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "a3c2b1d0-6b0e-4f2b-9c1a-2d3f4a5b6c7d",
    "productName": "Laptop Dell XPS 15",
    "availableQuantity": 50,
    "reservedQuantity": 0
  }'

# Producto 2: Mouse Inalámbrico
curl -X POST http://localhost:3000/api/v1/products/stock \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "b4d3c2e1-7c1f-5g3c-0d2b-3e4f5a6b7c8e",
    "productName": "Mouse Logitech MX Master 3",
    "availableQuantity": 100,
    "reservedQuantity": 0
  }'

# Producto 3: Teclado Mecánico
curl -X POST http://localhost:3000/api/v1/products/stock \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "c5e4d3f2-8d2g-6h4d-1e3c-4f5g6a7b8c9f",
    "productName": "Teclado Mecánico Keychron K8",
    "availableQuantity": 75,
    "reservedQuantity": 0
  }'
```

**Respuesta Esperada (201 Created):**
```json
{
  "productId": "a3c2b1d0-6b0e-4f2b-9c1a-2d3f4a5b6c7d",
  "productName": "Laptop Dell XPS 15",
  "availableQuantity": 50,
  "reservedQuantity": 0,
  "totalQuantity": 50,
  "createdAt": "2026-01-21T10:30:00.000Z",
  "updatedAt": "2026-01-21T10:30:00.000Z"
}
```

#### 2. Consultar Stock de un Producto

```bash
curl -X GET http://localhost:3000/api/v1/products/a3c2b1d0-6b0e-4f2b-9c1a-2d3f4a5b6c7d/stock
```

**Respuesta Esperada (200 OK):**
```json
{
  "productId": "a3c2b1d0-6b0e-4f2b-9c1a-2d3f4a5b6c7d",
  "productName": "Laptop Dell XPS 15",
  "availableQuantity": 50,
  "reservedQuantity": 0,
  "totalQuantity": 50,
  "createdAt": "2026-01-21T10:30:00.000Z",
  "updatedAt": "2026-01-21T10:30:00.000Z"
}
```

#### 3. Listar Todos los Stocks

```bash
curl -X GET http://localhost:3000/api/v1/products/stock/all
```

**Respuesta Esperada (200 OK):**
```json
[
  {
    "productId": "a3c2b1d0-6b0e-4f2b-9c1a-2d3f4a5b6c7d",
    "productName": "Laptop Dell XPS 15",
    "availableQuantity": 50,
    "reservedQuantity": 0,
    "totalQuantity": 50
  },
  {
    "productId": "b4d3c2e1-7c1f-5g3c-0d2b-3e4f5a6b7c8e",
    "productName": "Mouse Logitech MX Master 3",
    "availableQuantity": 100,
    "reservedQuantity": 0,
    "totalQuantity": 100
  },
  {
    "productId": "c5e4d3f2-8d2g-6h4d-1e3c-4f5g6a7b8c9f",
    "productName": "Teclado Mecánico Keychron K8",
    "availableQuantity": 75,
    "reservedQuantity": 0,
    "totalQuantity": 75
  }
]
```

### Casos de Prueba de Pedidos

#### Caso 1: Crear Pedido Exitoso (Stock Suficiente)

**Descripción**: Crear un pedido con productos que tienen stock suficiente.

```bash
curl -X POST http://localhost:8081/order-service/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-001",
    "items": [
      {
        "productId": "a3c2b1d0-6b0e-4f2b-9c1a-2d3f4a5b6c7d",
        "productName": "Laptop Dell XPS 15",
        "quantity": 2,
        "price": 1500.00
      },
      {
        "productId": "b4d3c2e1-7c1f-5g3c-0d2b-3e4f5a6b7c8e",
        "productName": "Mouse Logitech MX Master 3",
        "quantity": 5,
        "price": 99.99
      }
    ]
  }'
```

**Respuesta Esperada (201 Created):**
```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "customerId": "customer-001",
  "status": "PENDING",
  "totalAmount": 3499.95,
  "items": [
    {
      "productId": "a3c2b1d0-6b0e-4f2b-9c1a-2d3f4a5b6c7d",
      "productName": "Laptop Dell XPS 15",
      "quantity": 2,
      "price": 1500.00,
      "subtotal": 3000.00
    },
    {
      "productId": "b4d3c2e1-7c1f-5g3c-0d2b-3e4f5a6b7c8e",
      "productName": "Mouse Logitech MX Master 3",
      "quantity": 5,
      "price": 99.99,
      "subtotal": 499.95
    }
  ],
  "createdAt": "2026-01-21T10:35:00.000Z"
}
```

**Verificación**: 
- El pedido debe crearse con estado `PENDING`
- Después de unos segundos, el estado debe cambiar a `CONFIRMED`
- El stock en el inventario debe decrementar

#### Caso 2: Crear Pedido con Stock Insuficiente

**Descripción**: Intentar crear un pedido que excede el stock disponible.

```bash
curl -X POST http://localhost:8081/order-service/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-002",
    "items": [
      {
        "productId": "a3c2b1d0-6b0e-4f2b-9c1a-2d3f4a5b6c7d",
        "productName": "Laptop Dell XPS 15",
        "quantity": 100,
        "price": 1500.00
      }
    ]
  }'
```

**Respuesta Esperada (201 Created - pero el pedido será rechazado):**
```json
{
  "orderId": "660e8400-e29b-41d4-a716-446655440001",
  "customerId": "customer-002",
  "status": "PENDING",
  "totalAmount": 150000.00,
  "items": [
    {
      "productId": "a3c2b1d0-6b0e-4f2b-9c1a-2d3f4a5b6c7d",
      "productName": "Laptop Dell XPS 15",
      "quantity": 100,
      "price": 1500.00,
      "subtotal": 150000.00
    }
  ],
  "createdAt": "2026-01-21T10:40:00.000Z"
}
```

**Verificación**:
- El pedido se crea inicialmente con estado `PENDING`
- Después de unos segundos, el estado debe cambiar a `CANCELLED`
- El stock en el inventario NO debe cambiar

#### Caso 3: Consultar Detalles de un Pedido

**Descripción**: Obtener información detallada de un pedido existente.

```bash
# Usar el orderId obtenido en los casos anteriores
curl -X GET http://localhost:8081/order-service/api/orders/550e8400-e29b-41d4-a716-446655440000
```

**Respuesta Esperada (200 OK):**
```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "customerId": "customer-001",
  "status": "CONFIRMED",
  "totalAmount": 3499.95,
  "items": [
    {
      "productId": "a3c2b1d0-6b0e-4f2b-9c1a-2d3f4a5b6c7d",
      "productName": "Laptop Dell XPS 15",
      "quantity": 2,
      "price": 1500.00,
      "subtotal": 3000.00
    },
    {
      "productId": "b4d3c2e1-7c1f-5g3c-0d2b-3e4f5a6b7c8e",
      "productName": "Mouse Logitech MX Master 3",
      "quantity": 5,
      "price": 99.99,
      "subtotal": 499.95
    }
  ],
  "createdAt": "2026-01-21T10:35:00.000Z",
  "updatedAt": "2026-01-21T10:35:05.000Z"
}
```

#### Caso 4: Consultar Pedido No Existente

**Descripción**: Intentar obtener un pedido que no existe.

```bash
curl -X GET http://localhost:8081/order-service/api/orders/99999999-9999-9999-9999-999999999999
```

**Respuesta Esperada (404 Not Found):**
```json
{
  "timestamp": "2026-01-21T10:45:00.000Z",
  "status": 404,
  "error": "Not Found",
  "message": "Order not found with id: 99999999-9999-9999-9999-999999999999",
  "path": "/order-service/api/orders/99999999-9999-9999-9999-999999999999"
}
```

#### Caso 5: Crear Pedido con Datos Inválidos

**Descripción**: Intentar crear un pedido con datos inválidos (sin items).

```bash
curl -X POST http://localhost:8081/order-service/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-003",
    "items": []
  }'
```

**Respuesta Esperada (400 Bad Request):**
```json
{
  "timestamp": "2026-01-21T10:50:00.000Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Order must contain at least one item",
  "path": "/order-service/api/orders"
}
```

#### Caso 6: Crear Pedido con Múltiples Productos

**Descripción**: Crear un pedido con varios productos diferentes.

```bash
curl -X POST http://localhost:8081/order-service/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-004",
    "items": [
      {
        "productId": "a3c2b1d0-6b0e-4f2b-9c1a-2d3f4a5b6c7d",
        "productName": "Laptop Dell XPS 15",
        "quantity": 1,
        "price": 1500.00
      },
      {
        "productId": "b4d3c2e1-7c1f-5g3c-0d2b-3e4f5a6b7c8e",
        "productName": "Mouse Logitech MX Master 3",
        "quantity": 2,
        "price": 99.99
      },
      {
        "productId": "c5e4d3f2-8d2g-6h4d-1e3c-4f5g6a7b8c9f",
        "productName": "Teclado Mecánico Keychron K8",
        "quantity": 1,
        "price": 149.99
      }
    ]
  }'
```

**Respuesta Esperada (201 Created):**
```json
{
  "orderId": "770e8400-e29b-41d4-a716-446655440002",
  "customerId": "customer-004",
  "status": "PENDING",
  "totalAmount": 1849.97,
  "items": [
    {
      "productId": "a3c2b1d0-6b0e-4f2b-9c1a-2d3f4a5b6c7d",
      "productName": "Laptop Dell XPS 15",
      "quantity": 1,
      "price": 1500.00,
      "subtotal": 1500.00
    },
    {
      "productId": "b4d3c2e1-7c1f-5g3c-0d2b-3e4f5a6b7c8e",
      "productName": "Mouse Logitech MX Master 3",
      "quantity": 2,
      "price": 99.99,
      "subtotal": 199.98
    },
    {
      "productId": "c5e4d3f2-8d2g-6h4d-1e3c-4f5g6a7b8c9f",
      "productName": "Teclado Mecánico Keychron K8",
      "quantity": 1,
      "price": 149.99,
      "subtotal": 149.99
    }
  ],
  "createdAt": "2026-01-21T10:55:00.000Z"
}
```

### Verificar Comunicación entre Microservicios

#### Monitorear RabbitMQ

1. Acceder a la interfaz de administración: http://localhost:15672
2. Credenciales: admin/admin
3. Ir a la pestaña "Queues" para ver las colas activas
4. Verificar que existen las siguientes colas:
   - `order.created`
   - `stock.reserved`
   - `stock.rejected`

#### Verificar Logs

```bash
# Ver logs del Order Service
docker-compose logs -f order-service

# Ver logs del Inventory Service
docker-compose logs -f inventory-service

# Ver logs de RabbitMQ
docker-compose logs -f rabbitmq
```

### Escenarios de Prueba de Integración

#### Escenario 1: Flujo Completo Exitoso

1. Crear stock de productos (Inventory Service)
2. Crear un pedido (Order Service)
3. Verificar que el evento se publica en RabbitMQ
4. Verificar que el Inventory Service procesa el evento
5. Verificar que el stock se decrementa
6. Verificar que el estado del pedido cambia a CONFIRMED

#### Escenario 2: Flujo de Rechazo por Stock Insuficiente

1. Crear stock limitado de productos
2. Crear un pedido que exceda el stock
3. Verificar que el Inventory Service rechaza la reserva
4. Verificar que el estado del pedido cambia a CANCELLED
5. Verificar que el stock no cambia

## 📚 Endpoints

### Order Service (http://localhost:8081/order-service)

#### Crear Pedido
- **URL**: `/api/orders`
- **Método**: `POST`
- **Body**:
```json
{
  "customerId": "string",
  "items": [
    {
      "productId": "string (UUID)",
      "productName": "string",
      "quantity": "number (>0)",
      "price": "number (>0)"
    }
  ]
}
```
- **Respuesta Exitosa**: `201 Created`
- **Respuestas de Error**: `400 Bad Request`

#### Consultar Pedido
- **URL**: `/api/orders/{orderId}`
- **Método**: `GET`
- **Parámetros**: `orderId` (UUID)
- **Respuesta Exitosa**: `200 OK`
- **Respuestas de Error**: `404 Not Found`

### Inventory Service (http://localhost:3000)

#### Crear Stock de Producto
- **URL**: `/api/v1/products/stock`
- **Método**: `POST`
- **Body**:
```json
{
  "productId": "string (UUID)",
  "productName": "string",
  "availableQuantity": "number (>=0)",
  "reservedQuantity": "number (>=0)"
}
```
- **Respuesta Exitosa**: `201 Created`
- **Respuestas de Error**: `400 Bad Request`

#### Consultar Stock de Producto
- **URL**: `/api/v1/products/{productId}/stock`
- **Método**: `GET`
- **Parámetros**: `productId` (UUID)
- **Respuesta Exitosa**: `200 OK`
- **Respuestas de Error**: `404 Not Found`

#### Listar Todos los Stocks
- **URL**: `/api/v1/products/stock/all`
- **Método**: `GET`
- **Respuesta Exitosa**: `200 OK` (Array de stocks)

## 🔍 Troubleshooting

### Las tablas de base de datos no se crean automáticamente

Si ves errores como `relation "products_stock" does not exist` o `relation "orders" does not exist`:

**Causa**: El `NODE_ENV` está configurado como `production`, lo que desactiva la sincronización automática de TypeORM.

**Solución**:
1. Verificar que en [docker-compose.yaml](docker-compose.yaml) el servicio `inventory-service` tenga:
   ```yaml
   environment:
     NODE_ENV: development
   ```

2. Si ya habías ejecutado con `production`, limpia y reconstruye:
   ```bash
   docker-compose down -v
   docker-compose up --build
   ```

**Nota**: En producción real, deberías usar migraciones de base de datos en lugar de `synchronize: true`.

### Los servicios no inician correctamente

```bash
# Verificar logs de todos los servicios
docker-compose logs

# Reiniciar un servicio específico
docker-compose restart order-service
docker-compose restart inventory-service
```

### Error de conexión a base de datos

Verificar que las bases de datos estén saludables:
```bash
docker-compose ps
```

Si las bases de datos no están saludables, reiniciarlas:
```bash
docker-compose restart db-primary db-secondary
```

### Error de conexión a RabbitMQ

Verificar que RabbitMQ esté corriendo:
```bash
docker-compose logs rabbitmq
```

Acceder a la interfaz de administración y verificar las colas: http://localhost:15672

### Limpiar todo y empezar de nuevo

```bash
# Detener todos los servicios
docker-compose down

# Eliminar volúmenes (esto borrará los datos de las bases de datos)
docker-compose down -v

# Eliminar imágenes construidas
docker-compose down --rmi all

# Reconstruir y levantar
docker-compose up --build
```

## 📝 Notas Adicionales

### Configuración de Base de Datos

- **Order Service** usa PostgreSQL configurado con `hibernate.ddl-auto=update` para crear/actualizar tablas automáticamente
- **Inventory Service** usa TypeORM configurado con `synchronize: true` en modo desarrollo para crear tablas automáticamente
- **IMPORTANTE**: Asegúrate de que `NODE_ENV=development` en el servicio de inventario para que las tablas se creen automáticamente
- En un entorno de producción real, deberías:
  - Desactivar `synchronize` en TypeORM
  - Usar migraciones de base de datos (TypeORM migrations)
  - Configurar `hibernate.ddl-auto=validate` o `none` en Spring Boot

### Otras Notas

- Los servicios están configurados con healthchecks para asegurar que las dependencias estén listas antes de iniciar
- Las bases de datos usan volúmenes persistentes, por lo que los datos se mantienen entre reinicios (usa `docker-compose down -v` para limpiar)
- El Inventory Service expone una interfaz Swagger en http://localhost:3000/api/docs
- Los logs se pueden consultar en tiempo real usando `docker-compose logs -f`
- El sistema usa UUIDs para identificadores únicos de pedidos y productos

## 🤝 Contribuciones

Para contribuir al proyecto:
1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es parte de un laboratorio académico de Aplicaciones Distribuidas.
