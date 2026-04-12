import { useMutation } from "@tanstack/react-query";
import { OrderApiError, placeGuestOrder } from "../api/order-client";
import type {
  GuestOrder,
  PlaceGuestOrderRequest,
  StockConflict,
  ValidationErrorDetail,
} from "../types/api";

export interface PlaceOrderVariables {
  request: PlaceGuestOrderRequest;
  sessionToken: string;
}

// ─── Structured error types ───────────────────────────────────────────────────

export interface ValidationPlaceOrderError {
  type: "validation";
  details: ValidationErrorDetail[];
}

export interface StockConflictPlaceOrderError {
  type: "stock_conflict";
  message: string;
  /** Raw conflicts as returned by the API — product names resolved by the consumer */
  conflicts: StockConflict[];
}

export interface SessionExpiredPlaceOrderError {
  type: "session_expired";
  message: string;
}

export interface PaymentFailedPlaceOrderError {
  type: "payment_failed";
  message: string;
}

export interface OtherPlaceOrderError {
  type: "other";
  status: number;
  code: string;
  message: string;
}

export type PlaceOrderError =
  | ValidationPlaceOrderError
  | StockConflictPlaceOrderError
  | SessionExpiredPlaceOrderError
  | PaymentFailedPlaceOrderError
  | OtherPlaceOrderError;

// ─── Error classification ─────────────────────────────────────────────────────

function toPlaceOrderError(err: unknown): PlaceOrderError {
  if (err instanceof OrderApiError) {
    const withBody = err as OrderApiError & { body?: unknown };
    const body = withBody.body as Record<string, unknown> | undefined;

    if (err.status === 401) {
      return { type: "session_expired", message: "Your session has expired." };
    }

    if (err.status === 409 && body?.code === "STOCK_CONFLICT") {
      return {
        type: "stock_conflict",
        message: (body.message as string) ?? "Insufficient stock",
        conflicts: (body.conflicts as StockConflict[]) ?? [],
      };
    }

    if (err.status === 422 && Array.isArray((body as { details?: unknown })?.details)) {
      return {
        type: "validation",
        details: (body as { details: ValidationErrorDetail[] }).details,
      };
    }

    // 5xx, 502, or any other non-retryable status → payment failed message
    return {
      type: "payment_failed",
      message:
        "Payment could not be processed. Please try again or use a different payment method.",
    };
  }

  // Network error
  return {
    type: "payment_failed",
    message: "Payment could not be processed. Please try again or use a different payment method.",
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePlaceOrder() {
  return useMutation<GuestOrder, PlaceOrderError, PlaceOrderVariables>({
    mutationFn: async ({ request, sessionToken }) => {
      try {
        return await placeGuestOrder(request, sessionToken);
      } catch (err) {
        throw toPlaceOrderError(err);
      }
    },
  });
}
