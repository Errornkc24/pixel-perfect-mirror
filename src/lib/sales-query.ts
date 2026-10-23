import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SalesOrder } from "./sales";

export const adminSalesQuery = queryOptions({
  queryKey: ["admin", "sales"],
  queryFn: async (): Promise<SalesOrder[]> => {
    const orders: SalesOrder[] = [];
    // Page all history, rather than silently limiting reports to the latest 1,000 orders.
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await supabase.from("orders")
        .select("id, order_number, created_at, status, payment_status, payment_method, subtotal, shipping, total, order_items(name, product_id, price, quantity)")
        .order("created_at", { ascending: false }).order("id").range(offset, offset + 99);
      if (error) throw error;
      orders.push(...(data ?? []));
      if (!data || data.length < 100) break;
    }
    return orders;
  },
});