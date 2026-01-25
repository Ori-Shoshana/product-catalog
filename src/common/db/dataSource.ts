import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ProductEntity } from '../../product/dal/productEntity';

export const appDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [ProductEntity],
  synchronize: false,
  logging: false,
});

export async function initDataSource(): Promise<DataSource> {
  if (!appDataSource.isInitialized) {
    await appDataSource.initialize();
  }
  return appDataSource;
}
