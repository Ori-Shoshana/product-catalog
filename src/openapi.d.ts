/* eslint-disable */
import type { TypedRequestHandlers as ImportedTypedRequestHandlers } from '@map-colonies/openapi-helpers/typedRequestHandler';
export type paths = {
  '/products': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List products with geospatial filters */
    get: operations['getProducts'];
    put?: never;
    /** Create a new product */
    post: operations['createProduct'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/products/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: components['parameters']['ProductId'];
      };
      cookie?: never;
    };
    /** Get product by id */
    get: operations['getProductById'];
    put?: never;
    post?: never;
    /** Delete product */
    delete: operations['deleteProduct'];
    options?: never;
    head?: never;
    /** Partially update product */
    patch: operations['updateProduct'];
    trace?: never;
  };
};
export type webhooks = Record<string, never>;
export type components = {
  schemas: {
    error: {
      message: string;
    };
    /** @enum {string} */
    ProductType: 'raster' | 'rasterized vector' | '3d tiles' | 'QMesh';
    /** @enum {string} */
    ConsumptionProtocol: 'WMS' | 'WMTS' | 'XYZ' | '3D Tiles';
    ZoomLevel: number;
    /** Format: double */
    Resolution: number;
    GeometryString: string;
    ProductInput: {
      name: string;
      description?: string;
      boundingPolygon: components['schemas']['GeometryString'];
      type: components['schemas']['ProductType'];
      consumptionProtocol: components['schemas']['ConsumptionProtocol'];
      resolutionBest?: components['schemas']['Resolution'];
      minZoom?: components['schemas']['ZoomLevel'];
      maxZoom?: components['schemas']['ZoomLevel'];
    };
    ProductUpdate: {
      name?: string;
      description?: string;
      boundingPolygon?: components['schemas']['GeometryString'];
      type?: components['schemas']['ProductType'];
      consumptionProtocol?: components['schemas']['ConsumptionProtocol'];
      resolutionBest?: components['schemas']['Resolution'];
      minZoom?: components['schemas']['ZoomLevel'];
      maxZoom?: components['schemas']['ZoomLevel'];
    };
    Product: components['schemas']['ProductInput'] & {
      id: string;
    };
  };
  responses: {
    /** @description Bad Request */
    BadRequest: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['error'];
      };
    };
    /** @description Not Found */
    NotFound: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['error'];
      };
    };
  };
  parameters: {
    ProductId: string;
    Name: string;
    ProductType: components['schemas']['ProductType'];
    ConsumptionProtocol: components['schemas']['ConsumptionProtocol'];
    MinZoom: components['schemas']['ZoomLevel'];
    MaxZoom: components['schemas']['ZoomLevel'];
    ResolutionBest: components['schemas']['Resolution'];
    MinZoomGreater: components['schemas']['ZoomLevel'];
    MaxZoomGreater: components['schemas']['ZoomLevel'];
    /** @description Geometry in WKT (Well-Known Text) format */
    BoundingPolygonIntersects: components['schemas']['GeometryString'];
  };
  requestBodies: never;
  headers: never;
  pathItems: never;
};
export type $defs = Record<string, never>;
export interface operations {
  getProducts: {
    parameters: {
      query?: {
        name?: components['parameters']['Name'];
        type?: components['parameters']['ProductType'];
        consumptionProtocol?: components['parameters']['ConsumptionProtocol'];
        minZoom?: components['parameters']['MinZoom'];
        maxZoom?: components['parameters']['MaxZoom'];
        resolutionBest?: components['parameters']['ResolutionBest'];
        minZoomGreater?: components['parameters']['MinZoomGreater'];
        maxZoomGreater?: components['parameters']['MaxZoomGreater'];
        /** @description Geometry in WKT (Well-Known Text) format */
        boundingPolygonIntersects?: components['parameters']['BoundingPolygonIntersects'];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description List of products */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Product'][];
        };
      };
      400: components['responses']['BadRequest'];
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['error'];
        };
      };
    };
  };
  createProduct: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ProductInput'];
      };
    };
    responses: {
      /** @description Product created */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Product'];
        };
      };
      400: components['responses']['BadRequest'];
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['error'];
        };
      };
    };
  };
  getProductById: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: components['parameters']['ProductId'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Product'];
        };
      };
      404: components['responses']['NotFound'];
    };
  };
  deleteProduct: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: components['parameters']['ProductId'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Deleted */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      404: components['responses']['NotFound'];
    };
  };
  updateProduct: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: components['parameters']['ProductId'];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ProductUpdate'];
      };
    };
    responses: {
      /** @description Updated */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Product'];
        };
      };
      404: components['responses']['NotFound'];
    };
  };
}
export type TypedRequestHandlers = ImportedTypedRequestHandlers<paths, operations>;
