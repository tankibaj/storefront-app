import { Navigate, Route, Routes } from "react-router-dom";
import { NotFound } from "./components/NotFound";
import { ProductDetailPage } from "./features/catalogue/components/ProductDetailPage";
import { ProductListPage } from "./features/catalogue/components/ProductListPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/products" replace />} />
      <Route path="/products" element={<ProductListPage />} />
      <Route path="/products/:productId" element={<ProductDetailPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
