import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { type Registry, Counter } from 'prom-client';
import type { Logger } from '@map-colonies/js-logger';
import { SERVICES } from '@common/constants';
import { ProductManager } from '../models/productManager';
import type { ProductCreateInput, ProductUpdateInput, ProductQueryFilters } from '../models/product';

@injectable()
export class ProductController {
  private readonly createdResourceCounter: Counter;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(ProductManager) private readonly manager: ProductManager,
    @inject(SERVICES.METRICS) private readonly metricsRegistry: Registry
  ) {
    this.createdResourceCounter = new Counter({
      name: 'created_products_count',
      help: 'number of created products',
      registers: [this.metricsRegistry],
    });
  }

  public getProducts: RequestHandler = async (req, res, next) => {
    try {
      const filters = req.query as unknown as ProductQueryFilters;
      const products = await this.manager.getProducts(filters);
      return res.status(httpStatus.OK).json(products);
    } catch (error: unknown) {
      return next(error);
    }
  };

  public getProductById: RequestHandler = async (req, res, next) => {
    try {
      const product = await this.manager.getProductById(req.params.id);
      return res.status(httpStatus.OK).json(product);
    } catch (error: unknown) {
      return next(error);
    }
  };

  public createProduct: RequestHandler = async (req, res, next) => {
    try {
      const input = req.body as unknown as ProductCreateInput;
      const created = await this.manager.createProduct(input);
      this.createdResourceCounter.inc(1);
      return res.status(httpStatus.CREATED).json(created);
    } catch (error: unknown) {
      return next(error);
    }
  };

  public updateProduct: RequestHandler = async (req, res, next) => {
    try {
      const input = req.body as unknown as ProductUpdateInput;
      const updated = await this.manager.updateProduct(req.params.id, input);
      return res.status(httpStatus.OK).json(updated);
    } catch (error: unknown) {
      return next(error);
    }
  };

  public deleteProduct: RequestHandler = async (req, res, next) => {
    try {
      await this.manager.deleteProduct(req.params.id);
      return res.status(httpStatus.NO_CONTENT).send();
    } catch (error: unknown) {
      return next(error);
    }
  };
}
