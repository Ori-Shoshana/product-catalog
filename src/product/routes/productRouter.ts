import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { ProductController } from '../controllers/productController';

const productRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(ProductController);

  router.get('/', controller.getProducts);
  router.get('/:id', controller.getProductById);
  router.post('/', controller.createProduct);
  router.patch('/:id', controller.updateProduct);
  router.delete('/:id', controller.deleteProduct);

  return router;
};

export const PRODUCT_ROUTER_SYMBOL = Symbol('productRouterFactory');

export { productRouterFactory };
