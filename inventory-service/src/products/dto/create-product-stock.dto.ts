import { IsUUID, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductStockDto {
  @ApiProperty({
    description: 'UUID del producto',
    example: 'a3c2b1d0-6b0e-4f2b-9c1a-2d3f4a5b6c7d',
  })
  @IsUUID('4', { message: 'productId debe ser un UUID válido' })
  productId: string;

  @ApiProperty({
    description: 'Stock disponible inicial',
    example: 100,
    minimum: 0,
  })
  @IsInt({ message: 'availableStock debe ser un número entero' })
  @Min(0, { message: 'availableStock debe ser mayor o igual a 0' })
  availableStock: number;

  @ApiProperty({
    description: 'Stock reservado inicial',
    example: 0,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'reservedStock debe ser un número entero' })
  @Min(0, { message: 'reservedStock debe ser mayor o igual a 0' })
  reservedStock?: number;
}
