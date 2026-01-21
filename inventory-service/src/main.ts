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
  const rmqUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672';
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl],
      queue: 'order.queue',
      queueOptions: {
        durable: true,
      },
      noAck: false, // Requerir confirmación manual de mensajes
      // Configurar prefetch para procesar un mensaje a la vez
      prefetchCount: 1,
      // Configuración mejorada para compatibilidad con Spring Boot RabbitTemplate
      deserializer: {
        deserialize: (value: any, options?: any) => {
          try {
            let messageContent: any;
            let routingKey: string;

            // Caso 1: Mensaje ya deserializado por Spring Boot (Jackson2JsonMessageConverter)
            // En este caso, value es directamente el objeto deserializado
            if (value && typeof value === 'object' && !value.content && !value.fields) {
              logger.log('Mensaje recibido en formato Spring Boot (ya deserializado)', {
                hasOrderId: !!value.orderId,
                hasEventType: !!value.eventType,
                keys: Object.keys(value),
              });

              // El mensaje ya está deserializado, usarlo directamente
              messageContent = value;

              // Determinar el pattern basado en el eventType
              const eventTypeMap: Record<string, string> = {
                'ORDER_CREATED': 'order.created',
                'STOCK_RESERVED': 'stock.reserved',
                'STOCK_REJECTED': 'stock.rejected',
              };

              const pattern = eventTypeMap[messageContent.eventType] || 'order.created';
              
              logger.log(`Mensaje Spring Boot procesado exitosamente`, {
                pattern,
                orderId: messageContent.orderId,
                eventType: messageContent.eventType,
              });

              return {
                pattern,
                data: messageContent,
              };
            }

            // Caso 2: Mensaje raw de RabbitMQ (con content y fields)
            if (value && value.content) {
              logger.log('Mensaje recibido en formato raw de RabbitMQ');

              // Extraer el routing key
              routingKey = value.fields?.routingKey;
              if (!routingKey) {
                logger.warn('Mensaje raw sin routing key recibido', {
                  fields: value.fields,
                });
                return { pattern: '', data: null };
              }

              logger.log(`Mensaje recibido con routing key: ${routingKey}`);

              // Parsear el contenido JSON del mensaje
              try {
                const contentStr = value.content.toString('utf8');
                logger.debug(`Contenido raw del mensaje: ${contentStr}`);
                messageContent = JSON.parse(contentStr);
              } catch (parseError) {
                logger.error('Error al parsear JSON del mensaje', {
                  error: parseError,
                  content: value.content.toString('utf8'),
                });
                return { pattern: '', data: null };
              }

              // Mapear routing keys a patterns de NestJS
              const patternMap: Record<string, string> = {
                'order.created': 'order.created',
                'stock.reserved': 'stock.reserved',
                'stock.rejected': 'stock.rejected',
              };
              const pattern = patternMap[routingKey] || routingKey;

              logger.log(`Mensaje raw deserializado exitosamente`, {
                pattern,
                orderId: messageContent.orderId,
                eventType: messageContent.eventType,
              });

              return {
                pattern,
                data: messageContent,
              };
            }

            // Caso 3: Mensaje inválido
            logger.warn('Mensaje recibido en formato desconocido', {
              hasValue: !!value,
              hasContent: value?.content !== undefined,
              hasFields: value?.fields !== undefined,
              valueType: typeof value,
              valueKeys: value && typeof value === 'object' ? Object.keys(value) : [],
            });
            return { pattern: '', data: null };

          } catch (error) {
            logger.error('Error crítico al deserializar mensaje:', error);
            // Retornar objeto vacío en lugar de null para evitar crash
            return { pattern: '', data: null };
          }
        },
      },
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
