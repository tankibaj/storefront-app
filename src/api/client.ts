import type { ErrorResponse, Product, ProductPage } from "../types/api";

const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_INVENTORY_API_URL) ||
  "http://localhost:8001/api/v1";

const TENANT_ID =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_TENANT_ID) ||
  "00000000-0000-0000-0000-000000000001";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-ID": TENANT_ID,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({
      code: "UNKNOWN",
      message: response.statusText,
    }))) as ErrorResponse;
    throw new ApiError(response.status, body.code, body.message);
  }

  return response.json() as Promise<T>;
}

export interface ListProductsParams {
  page?: number;
  per_page?: number;
  in_stock_only?: boolean;
}

export function listProducts(params: ListProductsParams = {}): Promise<ProductPage> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.per_page !== undefined) query.set("per_page", String(params.per_page));
  if (params.in_stock_only !== undefined)
    query.set("in_stock_only", String(params.in_stock_only));
  const qs = query.toString();
  return apiFetch<ProductPage>(`/products${qs ? `?${qs}` : ""}`);
}

export function getProduct(productId: string): Promise<Product> {
  return apiFetch<Product>(`/products/${productId}`);
}
