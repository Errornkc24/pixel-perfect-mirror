import type { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];

export const FREE_SHIPPING_THRESHOLD = 999;
export const SHIPPING_FEE = 79;
export const LOW_STOCK_DISPLAY = 5;

export function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export function shippingFor(subtotal: number) {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export type StockState = { kind: "out" } | { kind: "low"; left: number } | { kind: "available" };

/** Stock 0 → out; 1–5 → "Only X left"; above 5 the number is never revealed. */
export function stockState(stock: number): StockState {
  if (stock <= 0) return { kind: "out" };
  if (stock <= LOW_STOCK_DISPLAY) return { kind: "low", left: stock };
  return { kind: "available" };
}

export function clampQty(qty: number, stock: number) {
  return Math.max(0, Math.min(Math.floor(qty), stock, 50));
}

export const ORDER_STEPS: OrderStatus[] = ["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function canCustomerCancel(status: OrderStatus) {
  return status === "placed" || status === "confirmed";
}
