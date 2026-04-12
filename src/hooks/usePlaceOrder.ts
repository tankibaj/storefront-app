import { useMutation } from "@tanstack/react-query";
import { OrderApiError, placeGuestOrder } from "../api/order-client";
import type { GuestOrder, PlaceGuestOrderRequest, ValidationErrorDetail } from "../types/api";

export interface PlaceOrderVariables {
  request: PlaceGuestOrderRequest;
  sessionToken: string;
}

export interface ValidationPlaceOrderError {
  type: "validation";
  details: ValidationErrorDetail[];
}

export interface OtherPlaceOrderError {
  type: "other";
  status: number;
  code: string;
  message: string;
}

export type PlaceOrderError = ValidationPlaceOrderError | OtherPlaceOrderError;

function toPlaceOrderError(err: unknown): PlaceOrderError {
  if (err instanceof OrderApiError) {
    const withBody = err as OrderApiError & { body?: unknown };
    if (err.status === 422 && withBody.body) {
      const body = withBody.body as { details?: ValidationErrorDetail[] };
      if (Array.isArray(body.details)) {
        return { type: "validation", details: body.details };
      }
    }
    return { type: "other", status: err.status, code: err.code, message: err.message };
  }
  return { type: "other", status: 0, code: "NETWORK_ERROR", message: "Network error" };
}

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
