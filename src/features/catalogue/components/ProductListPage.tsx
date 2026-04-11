import { useState } from "react";
import { EmptyState } from "../../../components/EmptyState";
import { useProducts } from "../hooks/useProducts";
import { InStockFilter } from "./InStockFilter";
import { Pagination } from "./Pagination";
import { ProductCard } from "./ProductCard";

const PER_PAGE = 20;

export function ProductListPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [inStockOnly, setInStockOnly] = useState(false);

  const { data, isLoading, isError, refetch } = useProducts({
    page: currentPage,
    perPage: PER_PAGE,
    inStockOnly,
  });

  const handleFilterChange = (checked: boolean) => {
    setInStockOnly(checked);
    setCurrentPage(1);
  };

  const totalPages = data ? Math.ceil(data.meta.total / data.meta.per_page) : 0;

  return (
    <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "1rem" }}>
      <h1>Products</h1>

      <div style={{ marginBottom: "1rem" }}>
        <InStockFilter checked={inStockOnly} onChange={handleFilterChange} />
      </div>

      {isLoading && <p>Loading products…</p>}

      {isError && (
        <div>
          <p>Unable to load products. Please try again.</p>
          <button type="button" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          {data.data.length === 0 ? (
            <EmptyState message="No products available" />
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: "1rem",
                }}
              >
                {data.data.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </>
      )}
    </main>
  );
}
