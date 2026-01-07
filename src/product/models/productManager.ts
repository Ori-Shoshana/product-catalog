import { inject, injectable } from 'tsyringe';
import type { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { SERVICES } from '@common/constants';
import { ProductRepository } from '../dal/productRepository';
import type { Product, ProductCreateInput, ProductUpdateInput, ProductQueryFilters } from './product';

class AppError extends Error {
  public constructor(
    public status: number,
    message: string
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

@injectable()
export class ProductManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject('ProductRepository') private readonly repository: ProductRepository
  ) {}

  public async getProducts(filters: ProductQueryFilters): Promise<Product[]> {
    this.logger.info({ msg: 'fetching products', filters });
    return this.repository.queryProducts(filters);
  }

  public async getProductById(idParam: unknown): Promise<Product> {
    const id = this.parseId(idParam);
    const product = await this.repository.getProductById(id);

    if (!product) {
      throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
    }
    return product;
  }

  public async createProduct(input: ProductCreateInput): Promise<Product> {
    if (!input.name) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Missing required field: name');
    }
    return this.repository.createProduct(input);
  }

  public async updateProduct(idParam: unknown, input: ProductUpdateInput): Promise<Product> {
    const id = this.parseId(idParam);
    const updated = await this.repository.updateProduct(id, input);

    if (!updated) {
      throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
    }
    return updated;
  }

  public async deleteProduct(idParam: unknown): Promise<void> {
    const id = this.parseId(idParam);
    const ok = await this.repository.deleteProduct(id);

    if (!ok) {
      throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
    }
  }

  private parseId(idParam: unknown): number {
    if (typeof idParam !== 'string') {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid id');
    }
    const id = Number(idParam);
    if (!Number.isInteger(id)) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid id: must be a numeric string');
    }
    return id;
  }
}
