import { useQuery } from "@tanstack/react-query";
import { fetchShippingMethods } from "../api/order-client";
import { useCheckoutStore } from "../stores/checkout-store";

export function useShippingMethods() {
  const sessionToken = useCheckoutStore((state) => state.sessionToken);

  return useQuery({
    queryKey: ["shipping-methods", sessionToken],
    queryFn: () => fetchShippingMethods(sessionToken as string),
    enabled: !!sessionToken,
    staleTime: 1000 * 60 * 5,
  });
}
