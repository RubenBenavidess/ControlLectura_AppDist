# Etapa 1: Build
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copiar archivos de configuración de Maven
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn

# Descargar dependencias
RUN mvn dependency:go-offline -B

# Copiar código fuente
COPY src ./src

# Construir la aplicación
RUN mvn clean package -DskipTests

# Etapa 2: Runtime
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copiar el JAR construido desde la etapa de build
COPY --from=build /app/target/*.jar app.jar

# Exponer el puerto
EXPOSE 8081

# Variables de entorno por defecto (pueden ser sobrescritas en docker-compose)
ENV SPRING_DATASOURCE_URL=jdbc:postgresql://db-primary:5432/order_db
ENV SPRING_DATASOURCE_USERNAME=admin
ENV SPRING_DATASOURCE_PASSWORD=password123
ENV SPRING_RABBITMQ_HOST=rabbitmq
ENV SPRING_RABBITMQ_PORT=5672
ENV SPRING_RABBITMQ_USERNAME=admin
ENV SPRING_RABBITMQ_PASSWORD=admin

# Comando para ejecutar la aplicación
ENTRYPOINT ["java", "-jar", "app.jar"]
