import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProductStock } from './entities/product-stock.entity';
import { CreateProductStockDto } from './dto/create-product-stock.dto';
import { ProductStockResponseDto } from './dto/product-stock-response.dto';
import { OrderItemEvent } from '../messaging/events/order-item.event';

@Injectable()
export class ProductStockService {
  private readonly logger = new Logger(ProductStockService.name);

  constructor(
    @InjectRepository(ProductStock)
    private readonly productStockRepository: Repository<ProductStock>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Crea un nuevo registro de stock para un producto
   */
  async createProductStock(
    createDto: CreateProductStockDto,
  ): Promise<ProductStockResponseDto> {
    const existingStock = await this.productStockRepository.findOne({
      where: { productId: createDto.productId },
    });

    if (existingStock) {
      throw new BadRequestException(
        `El stock para el producto ${createDto.productId} ya existe`,
      );
    }

    const productStock = this.productStockRepository.create({
      productId: createDto.productId,
      availableStock: createDto.availableStock,
      reservedStock: createDto.reservedStock || 0,
    });

    const saved = await this.productStockRepository.save(productStock);
    this.logger.log(`Stock creado para producto ${saved.productId}`);

    return new ProductStockResponseDto(saved);
  }

  /**
   * Obtiene el stock de un producto por su ID
   */
  async getProductStock(productId: string): Promise<ProductStockResponseDto> {
    const productStock = await this.productStockRepository.findOne({
      where: { productId },
    });

    if (!productStock) {
      throw new NotFoundException(
        `Stock no encontrado para el producto ${productId}`,
      );
    }

    return new ProductStockResponseDto(productStock);
  }

  /**
   * Valida si hay stock disponible para todos los items de un pedido
   */
  async validateStockAvailability(
    items: OrderItemEvent[],
  ): Promise<{ isAvailable: boolean; reason?: string }> {
    for (const item of items) {
      const productStock = await this.productStockRepository.findOne({
        where: { productId: item.productId },
      });

      if (!productStock) {
        return {
          isAvailable: false,
          reason: `Product ${item.productId} not found in inventory`,
        };
      }

      if (productStock.availableStock < item.quantity) {
        return {
          isAvailable: false,
          reason: `Insufficient stock for product ${item.productId}. Available: ${productStock.availableStock}, Requested: ${item.quantity}`,
        };
      }
    }

    return { isAvailable: true };
  }

  /**
   * Reserva el stock para los items de un pedido (dentro de una transacción)
   */
  async reserveStock(items: OrderItemEvent[]): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const item of items) {
        const productStock = await queryRunner.manager.findOne(ProductStock, {
          where: { productId: item.productId },
          lock: { mode: 'pessimistic_write' }, // Lock para evitar race conditions
        });

        if (!productStock) {
          throw new NotFoundException(
            `Product ${item.productId} not found in inventory`,
          );
        }

        if (productStock.availableStock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${item.productId}`,
          );
        }

        // Decrementar el stock disponible y aumentar el reservado
        productStock.availableStock -= item.quantity;
        productStock.reservedStock += item.quantity;

        await queryRunner.manager.save(ProductStock, productStock);

        this.logger.log(
          `Stock reservado para producto ${item.productId}: ${item.quantity} unidades`,
        );
      }

      await queryRunner.commitTransaction();
      this.logger.log('Stock reservado exitosamente para todos los items');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error al reservar stock, rollback ejecutado', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Obtiene todos los stocks de productos
   */
  async getAllProductStocks(): Promise<ProductStockResponseDto[]> {
    const stocks = await this.productStockRepository.find();
    return stocks.map((stock) => new ProductStockResponseDto(stock));
  }

  /**
   * Actualiza el stock disponible de un producto
   */
  async updateAvailableStock(
    productId: string,
    quantity: number,
  ): Promise<ProductStockResponseDto> {
    const productStock = await this.productStockRepository.findOne({
      where: { productId },
    });

    if (!productStock) {
      throw new NotFoundException(
        `Stock no encontrado para el producto ${productId}`,
      );
    }

    productStock.availableStock = quantity;
    const updated = await this.productStockRepository.save(productStock);

    this.logger.log(
      `Stock actualizado para producto ${productId}: ${quantity} unidades disponibles`,
    );

    return new ProductStockResponseDto(updated);
  }
}
