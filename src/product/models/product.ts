export type ProductType = 'raster' | 'rasterized vector' | '3d tiles' | 'QMesh';

export type ConsumptionProtocol = 'WMS' | 'WMTS' | 'XYZ' | '3D Tiles';

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
