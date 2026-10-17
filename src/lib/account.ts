import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const profileQuery = (uid: string) =>
  queryOptions({
    queryKey: ["profile", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const addressesQuery = (uid: string) =>
  queryOptions({
    queryKey: ["addresses", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("addresses").select("*").eq("user_id", uid).order("is_default", { ascending: false }).order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
