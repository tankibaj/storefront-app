import { useQuery } from "@tanstack/react-query";
import { listProducts } from "../../../api/client";

export interface UseProductsOptions {
  page: number;
  perPage: number;
  inStockOnly: boolean;
}

export function useProducts({ page, perPage, inStockOnly }: UseProductsOptions) {
  return useQuery({
    queryKey: ["products", { page, perPage, inStockOnly }],
    queryFn: () =>
      listProducts({ page, per_page: perPage, in_stock_only: inStockOnly || undefined }),
  });
}
