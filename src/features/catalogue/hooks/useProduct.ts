import { useQuery } from "@tanstack/react-query";
import { getProduct } from "../../../api/client";

export function useProduct(productId: string) {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProduct(productId),
    enabled: !!productId,
  });
}
