import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { createRequestSender, RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import { Pool } from 'pg';
import { paths, operations } from '@openapi';
import { getApp } from '@src/app';
import { SERVICES } from '@common/constants';
import { initConfig } from '@src/common/config';
import { ConsumptionProtocol, ProductType } from '@src/product/models/product';

describe('Product Integration Tests', function () {
  let requestSender: RequestSender<paths, operations>;
  let dbPool: Pool;

  beforeAll(async function () {
    await initConfig(true);
    const [app, container] = await getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
      ],
      useChild: true,
    });

    dbPool = container.resolve<Pool>('DbPool');
    requestSender = await createRequestSender<paths, operations>('openapi3.yaml', app);
  });

  beforeEach(async function () {
    await dbPool.query('DELETE FROM products');
  });

  afterAll(async function () {
    await dbPool.end();
  });

  describe('Happy Path', function () {
    it('should create a product and return 201', async function () {
      const body = {
        name: 'Integration Map',
        description: 'Valid description string',
        type: 'raster',
        consumptionProtocol: 'WMS',
        boundingPolygon: 'POLYGON((30 10, 40 40, 20 40, 10 20, 30 10))',
        resolutionBest: 0.1,
        minZoom: 0,
        maxZoom: 20,
      };

      const response = (await (requestSender.createProduct as unknown as (args: { requestBody: unknown }) => Promise<unknown>)({
        requestBody: body,
      })) as { status: number };

      expect(response.status).toBe(httpStatusCodes.CREATED);
      expect(response).toSatisfyApiSpec();
    });

    it('should update an existing product and return 200', async function () {
      const createRes = (await dbPool.query(
        `INSERT INTO products 
        (name, description, type, consumption_protocol, bounding_polygon, resolution_best, min_zoom, max_zoom) 
        VALUES 
        ('To Update', 'initial description', 'raster', 'WMS', ST_GeomFromText('POLYGON((30 10, 40 40, 20 40, 10 20, 30 10))'), 0.1, 0, 20) 
        RETURNING id::text`
      )) as { rows: { id: string }[] };

      const id = createRes.rows[0]!.id;

      const updateBody = {
        name: 'Updated Name',
        description: 'Updated description',
        type: 'raster',
        consumptionProtocol: 'WMS',
        boundingPolygon: 'POLYGON((30 10, 40 40, 20 40, 10 20, 30 10))',
        resolutionBest: 0.5,
        minZoom: 1,
        maxZoom: 18,
      };

      const response = (await (
        requestSender.updateProduct as unknown as (args: { pathParams: { id: string }; requestBody: unknown }) => Promise<unknown>
      )({
        pathParams: { id },
        requestBody: updateBody,
      })) as { status: number };

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response).toSatisfyApiSpec();
    });

    it('should cover all query filters and return 200', async function () {
      await dbPool.query(
        `INSERT INTO products 
        (name, description, type, consumption_protocol, bounding_polygon, resolution_best, min_zoom, max_zoom) 
        VALUES 
        ('MegaTest', 'desc', 'raster', 'WMS', ST_GeomFromText('POLYGON((0 0, 10 0, 10 10, 0 10, 0 0))'), 0.1, 5, 15)`
      );

      const response = await (requestSender.getProducts as unknown as (args: { query: unknown }) => Promise<{ status: number; body: unknown[] }>)({
        query: {
          name: 'MegaTest',
          type: 'raster',
          consumptionProtocol: 'WMS',
          minZoomGreaterEqual: 4,
          minZoomLessEqual: 6,
          maxZoomGreaterEqual: 14,
          maxZoomLessEqual: 16,
          resolutionBestGreaterEqual: 0.05,
          resolutionBestLessEqual: 0.15,
          boundingPolygonContains: 'POLYGON((2 2, 3 2, 3 3, 2 3, 2 2))',
        },
      });

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.body).toHaveLength(1);
      expect(response).toSatisfyApiSpec();
    });

    it('should delete an existing product and return 204', async function () {
      const createRes = (await dbPool.query(
        "INSERT INTO products (name, type, consumption_protocol) VALUES ('To Delete', 'raster', 'WMS') RETURNING id::text"
      )) as { rows: { id: string }[] };
      const id = createRes.rows[0]!.id;

      const response = (await (requestSender.deleteProduct as unknown as (args: { pathParams: { id: string } }) => Promise<unknown>)({
        pathParams: { id },
      })) as { status: number };

      expect(response.status).toBe(httpStatusCodes.NO_CONTENT);
    });
  });

  describe('Bad Path', function () {
    it('should return 404 for non-existent product id on update', async function () {
      const response = (await (
        requestSender.updateProduct as unknown as (args: { pathParams: { id: string }; requestBody: unknown }) => Promise<unknown>
      )({
        pathParams: { id: '999999' },
        requestBody: { name: 'None', type: 'raster', consumptionProtocol: 'WMS', boundingPolygon: 'POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))' },
      })) as { status: number };
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
    });

    it('should return 404 for non-existent product id on delete', async function () {
      const response = (await (requestSender.deleteProduct as unknown as (args: { pathParams: { id: string } }) => Promise<unknown>)({
        pathParams: { id: '999999' },
      })) as { status: number };
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
    });

    it('should return 400 when name is missing', async function () {
      const invalidInput = { type: 'raster' };
      const response = (await (requestSender.createProduct as unknown as (args: { requestBody: unknown }) => Promise<unknown>)({
        requestBody: invalidInput,
      })) as { status: number };
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });
  });

  describe('Edge Cases', function () {
    it('should return 500 when the DB is down', async function () {
      const originalQuery = dbPool.query.bind(dbPool);
      dbPool.query = jest.fn().mockRejectedValue(new Error('DB connection error'));

      const validInput = {
        name: 'Valid Name',
        type: 'raster' as ProductType,
        consumptionProtocol: 'WMS' as ConsumptionProtocol,
        boundingPolygon: 'POLYGON((30 10, 40 40, 20 40, 10 20, 30 10))',
      };

      const response = await (requestSender.createProduct as unknown as (args: { requestBody: unknown }) => Promise<{ status: number }>)({
        requestBody: validInput,
      });

      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      dbPool.query = originalQuery;
    });
  });
});
