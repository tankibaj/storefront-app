const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/**
 * Formats a price in minor currency units (cents) to a currency string.
 * e.g. 2999 → "$29.99"
 */
export function formatPrice(priceMinor: number): string {
  return formatter.format(priceMinor / 100);
}
