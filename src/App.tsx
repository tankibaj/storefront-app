import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { NotFound } from "./components/NotFound";
import { ProductDetailPage } from "./features/catalogue/components/ProductDetailPage";
import { ProductListPage } from "./features/catalogue/components/ProductListPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderConfirmationPage } from "./pages/OrderConfirmationPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/products" replace />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/confirmation" element={<OrderConfirmationPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
