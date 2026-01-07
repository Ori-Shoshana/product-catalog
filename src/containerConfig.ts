import { Pool } from 'pg';
import { getOtelMixin } from '@map-colonies/telemetry';
import { trace } from '@opentelemetry/api';
import { Registry } from 'prom-client';
import { DependencyContainer } from 'tsyringe/dist/typings/types';
import jsLogger from '@map-colonies/js-logger';
import { InjectionObject, registerDependencies } from '@common/dependencyRegistration';
import { SERVICES, SERVICE_NAME } from '@common/constants';
import { getTracing } from '@common/tracing';
import { getConfig } from './common/config';
import { ProductRepository } from './product/dal/productRepository';
import { ProductManager } from './product/models/productManager';
import { ProductController } from './product/controllers/productController';
import { productRouterFactory, PRODUCT_ROUTER_SYMBOL } from './product/routes/productRouter';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = async (options?: RegisterOptions): Promise<DependencyContainer> => {
  const configInstance = getConfig();

  const loggerConfig = configInstance.get('telemetry.logger');

  const logger = jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, mixin: getOtelMixin() });

  const tracer = trace.getTracer(SERVICE_NAME);

  const dbConnectionString = configInstance.get<string>('db.connectionString') as string;
  const pool = new Pool({
    connectionString: dbConnectionString,
  });
  const metricsRegistry = new Registry();
  configInstance.initializeMetrics(metricsRegistry);

  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: configInstance } },
    { token: SERVICES.LOGGER, provider: { useValue: logger } },
    { token: SERVICES.TRACER, provider: { useValue: tracer } },
    { token: SERVICES.METRICS, provider: { useValue: metricsRegistry } },
    { token: 'DbPool', provider: { useValue: pool } },
    { token: 'ProductRepository', provider: { useClass: ProductRepository } },
    { token: 'ProductManager', provider: { useClass: ProductManager } },
    { token: 'ProductController', provider: { useClass: ProductController } },
    { token: PRODUCT_ROUTER_SYMBOL, provider: { useFactory: productRouterFactory } },
    {
      token: 'onSignal',
      provider: {
        useValue: async (): Promise<void> => {
          await Promise.all([getTracing().stop()]);
        },
      },
    },
  ];

  return Promise.resolve(registerDependencies(dependencies, options?.override, options?.useChild));
};
