export const PRODUCT_TYPES = ['raster', 'rasterized vector', '3d tiles', 'QMesh'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const CONSUMPTION_PROTOCOLS = ['WMS', 'WMTS', 'XYZ', '3D Tiles'] as const;
export type ConsumptionProtocol = (typeof CONSUMPTION_PROTOCOLS)[number];

export interface Product {
  id: number;
  name: string;
  description?: string;
  boundingPolygon: string;
  consumptionLink?: string;
  type: ProductType;
  consumptionProtocol: ConsumptionProtocol;
  resolutionBest?: number;
  minZoom?: number;
  maxZoom?: number;
}

export type ProductCreateInput = Omit<Product, 'id'>;
export type ProductUpdateInput = Partial<ProductCreateInput>;

export interface ProductQueryFilters {
  name?: string;
  type?: ProductType;
  consumptionProtocol?: ConsumptionProtocol;

  minZoom?: number;
  minZoomGreater?: number;
  minZoomGreaterEqual?: number;
  minZoomLess?: number;
  minZoomLessEqual?: number;

  maxZoom?: number;
  maxZoomGreater?: number;
  maxZoomGreaterEqual?: number;
  maxZoomLess?: number;
  maxZoomLessEqual?: number;

  resolutionBest?: number;
  resolutionBestGreater?: number;
  resolutionBestGreaterEqual?: number;
  resolutionBestLess?: number;
  resolutionBestLessEqual?: number;

  boundingPolygonContains?: string;
  boundingPolygonWithin?: string;
  boundingPolygonIntersects?: string;
}
