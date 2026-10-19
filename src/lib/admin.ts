import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Database } from "@/integrations/supabase/types";

export type AdminRole = Database["public"]["Enums"]["app_role"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];

export function useRoles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["roles", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AdminRole[]> => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role);
    },
  });
}

export const isAdminRole = (roles?: AdminRole[]) => !!roles?.some((r) => r === "owner" || r === "staff");

/** A product is low when its stock is at or below its own alert level (but still counts out-of-stock). */
export function isLowStock(p: { stock: number; low_stock_threshold: number; archived?: boolean }) {
  return !p.archived && p.stock <= p.low_stock_threshold;
}

export const adminProductsQuery = queryOptions({
  queryKey: ["admin", "products"],
  queryFn: async () => {
    const { data, error } = await supabase.from("products").select("*, categories(name)").order("name");
    if (error) throw error;
    return data ?? [];
  },
});

export const adminOrdersQuery = queryOptions({
  queryKey: ["admin", "orders"],
  queryFn: async (): Promise<Order[]> => {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(1000);
    if (error) throw error;
    return data ?? [];
  },
});

export function contactOf(o: Order) {
  return (o.contact ?? {}) as Record<string, string>;
}
export function addressOf(o: Order) {
  return (o.shipping_address ?? {}) as Record<string, string>;
}

export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}
