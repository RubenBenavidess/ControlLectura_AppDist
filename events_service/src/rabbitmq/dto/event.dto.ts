import { IsString, IsEnum, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EventType } from '../interfaces/event-type.enum';

export class OrderItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;
}

export class OrderEventDto {
  @IsString()
  orderId: string;

  @IsString()
  customerId: string;

  @IsEnum(EventType)
  eventType: EventType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  shippingAddressJson: string;

  @IsNumber()
  timestamp: number;
}

export class InventoryResponseDto {
  @IsString()
  orderId: string;

  @IsEnum(EventType)
  eventType: EventType;

  @IsNumber()
  timestamp: number;
}
