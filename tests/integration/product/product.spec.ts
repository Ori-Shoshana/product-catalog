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
  let dbPool: Pool | undefined;

  beforeAll(async function () {
    await initConfig(true);
  });

  beforeEach(async function () {
    const [app, container] = await getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: true, level: 'error' }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
      ],
      useChild: true,
    });

    dbPool = container.resolve<Pool>('DbPool');
    await dbPool.query('DELETE FROM products');

    requestSender = await createRequestSender<paths, operations>('openapi3.yaml', app);
  });

  afterAll(async function () {
    if (dbPool) {
      await dbPool.end();
    }
  });

  // בדיקות "Happy Path"
  describe('Happy Path', function () {
    it('should create a product and return 201', async function () {
      const body: operations['createProduct']['requestBody']['content']['application/json'] = {
        name: 'Integration Map',
        description: 'Valid description string',
        type: 'raster',
        consumptionProtocol: 'WMS',
        boundingPolygon: 'POLYGON((30 10, 40 40, 20 40, 10 20, 30 10))',
        resolutionBest: 0.1,
        minZoom: 0,
        maxZoom: 20,
      };

      const response = (await (requestSender.createProduct as unknown as (args: { requestBody: typeof body }) => Promise<unknown>)({
        requestBody: body,
      })) as { status: number; body: { id: string } };

      expect(response.status).toBe(httpStatusCodes.CREATED);
      expect(response).toSatisfyApiSpec();
    });

    it('should retrieve all products and return 200', async function () {
      const response = (await (requestSender.getProducts as unknown as () => Promise<unknown>)()) as { status: number; body: unknown[] };

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response).toSatisfyApiSpec();
    });
  });

  describe('Bad Path', function () {
    it('should return 400 when name is missing', async function () {
      const invalidInput = { type: 'raster' };

      const response = (await (requestSender.createProduct as unknown as (args: { requestBody: unknown }) => Promise<unknown>)({
        requestBody: invalidInput,
      })) as { status: number };

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('should return 404 for non-existent product id', async function () {
      const response = (await (requestSender.getProductById as unknown as (args: { pathParams: { id: string } }) => Promise<unknown>)({
        pathParams: {
          id: '999999',
        },
      })) as { status: number };

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
    });
  });

  describe('Edge Cases', function () {
    it('should return 500 when the DB is down', async function () {
      if (!dbPool) {
        throw new Error('DB pool is not initialized');
      }

      dbPool.query = jest.fn().mockRejectedValue(new Error('DB connection error'));

      const validInput = {
        name: 'Valid Name',
        description: 'Description for valid product',
        type: 'raster' as ProductType,
        consumptionProtocol: 'WMS' as ConsumptionProtocol,
        boundingPolygon: 'POLYGON((30 10, 40 40, 20 40, 10 20, 30 10))',
        resolutionBest: 0.1,
        minZoom: 0,
        maxZoom: 20,
      };

      const response = await requestSender.createProduct({ requestBody: validInput });
      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return 400 if API endpoint is incorrect', async function () {
      const response = await requestSender.getProductById({ pathParams: { id: 'invalidId' } });
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });
  });
});
