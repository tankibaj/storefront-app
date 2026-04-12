import type { ErrorResponse, GuestSession, ShippingMethod } from "../types/api";

const ORDER_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_ORDER_API_URL) ||
  "http://localhost:8002/api/v1";

const TENANT_ID =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_TENANT_ID) ||
  "00000000-0000-0000-0000-000000000001";

export class OrderApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "OrderApiError";
  }
}

async function orderFetch<T>(
  path: string,
  sessionToken: string | null,
  init?: RequestInit
): Promise<T> {
  const url = `${ORDER_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-ID": TENANT_ID,
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (sessionToken) {
    headers["X-Guest-Session-Token"] = sessionToken;
  }

  const response = await fetch(url, { ...init, headers });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({
      code: "UNKNOWN",
      message: response.statusText,
    }))) as ErrorResponse;
    throw new OrderApiError(response.status, body.code, body.message);
  }

  return response.json() as Promise<T>;
}

export function createGuestSession(): Promise<GuestSession> {
  return orderFetch<GuestSession>("/checkout/guest/sessions", null, { method: "POST" });
}

export function fetchShippingMethods(sessionToken: string): Promise<ShippingMethod[]> {
  return orderFetch<ShippingMethod[]>("/checkout/shipping-methods", sessionToken);
}
