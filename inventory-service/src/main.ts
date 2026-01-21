import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Crear aplicación HTTP principal
  const app = await NestFactory.create(AppModule);

  // Configurar CORS
  app.enableCors();

  // Configurar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('Inventory Service API')
    .setDescription(
      'API del servicio de inventario para gestión de stock y procesamiento de pedidos',
    )
    .setVersion('1.0')
    .addTag('products', 'Endpoints para gestión de productos y stock')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Conectar microservicio RabbitMQ como listener
  const rmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl],
      queue: 'order_to_inventory_queue',
      queueOptions: {
        durable: true,
      },
      noAck: false, // Requerir confirmación manual de mensajes
    },
  });

  // Iniciar todos los microservicios conectados
  await app.startAllMicroservices();
  logger.log('Microservicio RabbitMQ iniciado y escuchando eventos');

  // Iniciar servidor HTTP
  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`Inventory Service iniciado en puerto ${port}`);
  logger.log(`Swagger disponible en http://localhost:${port}/api/docs`);
  logger.log(`RabbitMQ conectado a ${rmqUrl}`);
}

void bootstrap();
