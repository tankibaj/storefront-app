/**
 * TypeScript types derived from contracts/api/inventory-service.openapi.yaml
 * Do not hand-edit the shapes — they must stay in sync with the OpenAPI contract.
 */

export interface SKU {
  id: string;
  label: string;
  /** Price in minor currency units (e.g. cents). */
  price_minor: number;
  stock_level: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  /** URL of the product thumbnail image. Null if no image uploaded. */
  image_url: string | null;
  skus: SKU[];
  created_at: string;
}

export interface ProductPageMeta {
  total: number;
  page: number;
  per_page: number;
}

export interface ProductPage {
  data: Product[];
  meta: ProductPageMeta;
}

export interface ErrorResponse {
  code: string;
  message: string;
}
