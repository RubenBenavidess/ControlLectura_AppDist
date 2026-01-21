import { ApiProperty } from '@nestjs/swagger';

export class ProductStockResponseDto {
  @ApiProperty({
    description: 'UUID del producto',
    example: 'a3c2b1d0-6b0e-4f2b-9c1a-2d3f4a5b6c7d',
  })
  productId: string;

  @ApiProperty({
    description: 'Stock disponible',
    example: 25,
  })
  availableStock: number;

  @ApiProperty({
    description: 'Stock reservado',
    example: 3,
  })
  reservedStock: number;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2026-01-21T15:08:10Z',
  })
  updatedAt: Date;

  constructor(partial: Partial<ProductStockResponseDto>) {
    Object.assign(this, partial);
  }
}
