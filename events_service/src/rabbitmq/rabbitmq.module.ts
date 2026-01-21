import { Module, OnApplicationShutdown } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';

@Module({
  providers: [RabbitMQService],
  exports: [RabbitMQService],
})
export class RabbitMQModule implements OnApplicationShutdown {
  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async onApplicationShutdown() {
    await this.rabbitMQService.closeConnection();
  }
}
