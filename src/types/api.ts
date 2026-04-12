/**
 * TypeScript types derived from contracts/api/inventory-service.openapi.yaml and
 * contracts/api/order-service.openapi.yaml.
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

// ─── Checkout / Order Service ─────────────────────────────────────────────────

/**
 * Guest checkout session returned by POST /checkout/guest/sessions.
 * Derived from contracts/api/order-service.openapi.yaml
 */
export interface GuestSession {
  id: string;
  token: string;
  expires_at: string;
}

/**
 * Shipping method returned by GET /checkout/shipping-methods.
 * Derived from contracts/api/order-service.openapi.yaml
 */
export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  /** Cost in minor currency units (e.g. cents). */
  cost_minor: number;
  estimated_days_min: number;
  estimated_days_max: number;
}

// ─── Place Guest Order ────────────────────────────────────────────────────────

export interface PlaceGuestOrderLine {
  sku_id: string;
  quantity: number;
}

export interface PlaceGuestOrderPayment {
  type: "card";
  token: string;
}

export interface PlaceGuestOrderAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country_code: string;
}

export interface PlaceGuestOrderRequest {
  email: string;
  shipping_address: PlaceGuestOrderAddress;
  shipping_method_id: string;
  payment_method: PlaceGuestOrderPayment;
  lines: PlaceGuestOrderLine[];
}

export interface OrderLine {
  sku_id: string;
  product_name: string;
  variant_label: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface GuestOrder {
  id: string;
  reference: string;
  status: "confirmed" | "pending" | "cancelled";
  lines: OrderLine[];
  total: number;
  created_at: string;
}

export interface ValidationErrorDetail {
  field: string;
  issue: string;
}

export interface ValidationError {
  code: "VALIDATION_ERROR";
  message: string;
  details: ValidationErrorDetail[];
}

export interface StockConflict {
  sku_id: string;
  requested: number;
  available: number;
}

export interface StockConflictError {
  code: "STOCK_CONFLICT";
  message: string;
  conflicts: StockConflict[];
}
