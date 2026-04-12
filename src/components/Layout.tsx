import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CartIcon } from "./CartIcon";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1.5rem",
          borderBottom: "1px solid #e0e0e0",
          background: "#fff",
        }}
      >
        <Link
          to="/products"
          style={{
            textDecoration: "none",
            color: "inherit",
            fontWeight: "bold",
            fontSize: "1.25rem",
          }}
        >
          Storefront
        </Link>
        <CartIcon />
      </header>
      <div>{children}</div>
    </div>
  );
}
