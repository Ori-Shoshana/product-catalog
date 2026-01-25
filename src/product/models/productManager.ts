import { inject, injectable } from 'tsyringe';
import type { Logger } from '@map-colonies/js-logger';
import { SERVICES } from '@common/constants';
import { badRequest, notFound } from '@common/errors';
import { ProductRepository } from '../dal/productRepository';
import type { Product, ProductCreateInput, ProductUpdateInput, ProductQueryFilters } from './product';

@injectable()
export class ProductManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.PRODUCT_REPOSITORY) private readonly repository: ProductRepository
  ) {}

  public async getProducts(filters: ProductQueryFilters): Promise<Product[]> {
    this.logger.info({ msg: 'fetching products', filters });
    return this.repository.queryProducts(filters);
  }

  public async getProductById(id: number): Promise<Product> {
    const product = await this.repository.getProductById(id);
    if (!product) throw notFound('Product not found');
    return product;
  }

  public async createProduct(input: ProductCreateInput): Promise<Product> {
    if (!input.name) {
      throw badRequest('Missing required field: name');
    }
    return this.repository.createProduct(input);
  }
  public async updateProduct(id: number, input: ProductUpdateInput): Promise<Product> {
    const updated = await this.repository.updateProduct(id, input);
    if (!updated) throw notFound('Product not found');
    return updated;
  }

  public async deleteProduct(id: number): Promise<void> {
    await this.repository.deleteProduct(id);
  }
}
