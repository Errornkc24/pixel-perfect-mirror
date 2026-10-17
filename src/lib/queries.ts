import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Product } from "./shop";

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase.from("products").select("*").eq("archived", false).order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 30_000,
});

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase.from("categories").select("*").order("sort");
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 60_000,
});
