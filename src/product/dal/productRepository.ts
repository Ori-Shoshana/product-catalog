import { injectable, inject } from 'tsyringe';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import type { Logger } from '@map-colonies/js-logger';
import { SERVICES } from '../../common/constants';
import { badRequest, notFound, internalServerError } from '../../common/errors';
import type { Product, ProductCreateInput, ProductUpdateInput, ProductQueryFilters } from '../models/product';
import { ProductEntity } from './productEntity';

@injectable()
export class ProductRepository {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.DB_DATASOURCE) private readonly dataSource: DataSource
  ) {}

  public async createProduct(input: ProductCreateInput): Promise<Product> {
    this.logger.info({ msg: 'Creating a new product', productName: input.name });

    const insertResult = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(ProductEntity)
      .values({
        name: input.name,
        description: input.description ?? null,
        consumptionLink: input.consumptionLink ?? null,
        type: input.type,
        consumptionProtocol: input.consumptionProtocol,
        resolutionBest: input.resolutionBest ?? null,
        minZoom: input.minZoom ?? null,
        maxZoom: input.maxZoom ?? null,
        boundingPolygon: (): string => `ST_GeomFromText(:wkt)`,
      })
      .setParameters({ wkt: input.boundingPolygon })
      .returning(['id'])
      .execute();

    const id = insertResult.identifiers[0]?.id as number | undefined;
    if (id === undefined) {
      throw internalServerError('Failed to create product - no id returned');
    }

    const created = await this.getProductById(id);
    if (created === null) {
      throw internalServerError('Failed to create product - not found after insert');
    }
    return created;
  }

  public async getProductById(id: number): Promise<Product | null> {
    this.logger.debug({ msg: 'Fetching product by id', productId: id });
    const row = await this.baseQb().where('p.id = :id', { id }).getRawOne<Product>();
    return row ?? null;
  }

  public async getAllProducts(): Promise<Product[]> {
    this.logger.debug({ msg: 'Fetching all products' });
    return this.baseQb().getRawMany<Product>();
  }

  public async updateProduct(id: number, input: ProductUpdateInput): Promise<Product | null> {
    this.logger.info({ msg: 'Updating product', productId: id });

    const setObj: Record<string, unknown> = {};

    if (input.name !== undefined) setObj.name = input.name;
    if (input.description !== undefined) setObj.description = input.description ?? null;
    if (input.consumptionLink !== undefined) setObj.consumptionLink = input.consumptionLink ?? null;
    if (input.type !== undefined) setObj.type = input.type;
    if (input.consumptionProtocol !== undefined) setObj.consumptionProtocol = input.consumptionProtocol;
    if (input.resolutionBest !== undefined) setObj.resolutionBest = input.resolutionBest ?? null;
    if (input.minZoom !== undefined) setObj.minZoom = input.minZoom ?? null;
    if (input.maxZoom !== undefined) setObj.maxZoom = input.maxZoom ?? null;

    let wkt: string | undefined;
    if (input.boundingPolygon !== undefined) {
      setObj.boundingPolygon = (): string => `ST_GeomFromText(:wkt)`;
      wkt = input.boundingPolygon;
    }

    if (Object.keys(setObj).length === 0) throw badRequest('No fields provided for update');

    const qb = this.dataSource.createQueryBuilder().update(ProductEntity).set(setObj).where('id = :id', { id });
    if (wkt !== undefined) qb.setParameters({ wkt });

    await qb.execute();

    return this.getProductById(id);
  }

  public async deleteProduct(id: number): Promise<void> {
    this.logger.info({ msg: 'Deleting product', productId: id });
    const res = await this.dataSource.getRepository(ProductEntity).delete({ id });
    const deleted = (res.affected ?? 0) === 1;
    if (!deleted) throw notFound(`Product with id ${id} was not found`);
  }

  public async queryProducts(filters: ProductQueryFilters): Promise<Product[]> {
    this.logger.debug({ msg: 'Querying products with filters', filters });

    const qb = this.baseQb();

    const add = (condition: string, params: Record<string, unknown>, value: unknown): void => {
      if (value !== undefined) qb.andWhere(condition, params);
    };

    // equals
    add('p.name = :name', { name: filters.name }, filters.name);
    add('p.type = :type', { type: filters.type }, filters.type);
    add('p.consumption_protocol = :consumptionProtocol', { consumptionProtocol: filters.consumptionProtocol }, filters.consumptionProtocol);

    add('p.min_zoom = :minZoom', { minZoom: filters.minZoom }, filters.minZoom);
    add('p.max_zoom = :maxZoom', { maxZoom: filters.maxZoom }, filters.maxZoom);
    add('p.resolution_best = :resolutionBest', { resolutionBest: filters.resolutionBest }, filters.resolutionBest);

    // comparisons: minZoom
    add('p.min_zoom > :minZoomGreater', { minZoomGreater: filters.minZoomGreater }, filters.minZoomGreater);
    add('p.min_zoom >= :minZoomGreaterEqual', { minZoomGreaterEqual: filters.minZoomGreaterEqual }, filters.minZoomGreaterEqual);
    add('p.min_zoom < :minZoomLess', { minZoomLess: filters.minZoomLess }, filters.minZoomLess);
    add('p.min_zoom <= :minZoomLessEqual', { minZoomLessEqual: filters.minZoomLessEqual }, filters.minZoomLessEqual);

    // comparisons: maxZoom
    add('p.max_zoom > :maxZoomGreater', { maxZoomGreater: filters.maxZoomGreater }, filters.maxZoomGreater);
    add('p.max_zoom >= :maxZoomGreaterEqual', { maxZoomGreaterEqual: filters.maxZoomGreaterEqual }, filters.maxZoomGreaterEqual);
    add('p.max_zoom < :maxZoomLess', { maxZoomLess: filters.maxZoomLess }, filters.maxZoomLess);
    add('p.max_zoom <= :maxZoomLessEqual', { maxZoomLessEqual: filters.maxZoomLessEqual }, filters.maxZoomLessEqual);

    // comparisons: resolutionBest
    add('p.resolution_best > :resolutionBestGreater', { resolutionBestGreater: filters.resolutionBestGreater }, filters.resolutionBestGreater);
    add(
      'p.resolution_best >= :resolutionBestGreaterEqual',
      { resolutionBestGreaterEqual: filters.resolutionBestGreaterEqual },
      filters.resolutionBestGreaterEqual
    );
    add('p.resolution_best < :resolutionBestLess', { resolutionBestLess: filters.resolutionBestLess }, filters.resolutionBestLess);
    add(
      'p.resolution_best <= :resolutionBestLessEqual',
      { resolutionBestLessEqual: filters.resolutionBestLessEqual },
      filters.resolutionBestLessEqual
    );

    // spatial
    add(
      'ST_Contains(p.bounding_polygon, ST_GeomFromText(:boundingPolygonContains))',
      { boundingPolygonContains: filters.boundingPolygonContains },
      filters.boundingPolygonContains
    );
    add(
      'ST_Within(p.bounding_polygon, ST_GeomFromText(:boundingPolygonWithin))',
      { boundingPolygonWithin: filters.boundingPolygonWithin },
      filters.boundingPolygonWithin
    );
    add(
      'ST_Intersects(p.bounding_polygon, ST_GeomFromText(:boundingPolygonIntersects))',
      { boundingPolygonIntersects: filters.boundingPolygonIntersects },
      filters.boundingPolygonIntersects
    );

    return qb.getRawMany<Product>();
  }

  private baseQb(): SelectQueryBuilder<ProductEntity> {
    return this.dataSource
      .getRepository(ProductEntity)
      .createQueryBuilder('p')
      .select([
        `p.id::text as "id"`,
        `p.name as "name"`,
        `p.description as "description"`,
        `ST_AsText(p.bounding_polygon) as "boundingPolygon"`,
        `p.consumption_link as "consumptionLink"`,
        `p.type as "type"`,
        `p.consumption_protocol as "consumptionProtocol"`,
        `p.resolution_best as "resolutionBest"`,
        `p.min_zoom as "minZoom"`,
        `p.max_zoom as "maxZoom"`,
      ]);
  }
}
