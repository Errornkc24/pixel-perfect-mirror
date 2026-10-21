import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/admin/team")({ head: () => pageHead("Store team", "Manage owner and staff access to the candle store.", true), component: Team });

function Team() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: team = [], error } = useQuery({
    queryKey: ["admin", "team"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_team");
      if (error) throw error;
      return data ?? [];
    },
  });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"staff" | "owner">("staff");

  async function setR(e: string, r: "staff" | "owner", grant: boolean) {
    const { error } = await supabase.rpc("admin_set_role", { _email: e, _role: r, _grant: grant });
    if (error) return toast.error(error.message);
    toast.success(grant ? "Access given" : "Access removed");
    setEmail("");
    qc.invalidateQueries({ queryKey: ["admin", "team"] });
  }

  if (error) return <p className="text-muted-foreground">Only the owner can manage the team.</p>;
  return (
    <div className="space-y-4">
      <h2 className="text-3xl">Team</h2>
      <p className="text-sm text-muted-foreground">Staff can manage orders, products and stock. Owners can also manage categories and the team. The person must sign up on the store first.</p>
      <div className="flex flex-wrap gap-2">
        <Input type="email" placeholder="Their email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-64" />
        <select className="h-10 rounded-md border bg-background px-3 text-sm" value={role} onChange={(e) => setRole(e.target.value as "staff" | "owner")}><option value="staff">Staff</option><option value="owner">Owner</option></select>
        <Button disabled={!email.trim()} onClick={() => setR(email, role, true)}>Add</Button>
      </div>
      <ul className="divide-y divide-border rounded-2xl border bg-card/60">
        {team.map((m) => (
          <li key={m.user_id + m.role} className="flex items-center justify-between gap-3 p-3 text-sm">
            <span>{m.name || m.email}<span className="block text-xs text-muted-foreground">{m.email}</span></span>
            <span className="flex items-center gap-3">
              <span className="capitalize text-primary">{m.role}</span>
              {m.user_id !== user?.id && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => m.email && confirm(`Remove ${m.role} access for ${m.email}?`) && setR(m.email, m.role as "staff" | "owner", false)}>Remove</Button>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
