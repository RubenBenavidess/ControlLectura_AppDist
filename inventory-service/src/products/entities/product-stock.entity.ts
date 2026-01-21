import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('products_stock')
export class ProductStock {
  @PrimaryColumn('uuid')
  productId: string;

  @Column({ type: 'int', default: 0 })
  availableStock: number;

  @Column({ type: 'int', default: 0 })
  reservedStock: number;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
