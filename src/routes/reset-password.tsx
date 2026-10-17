import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Tanvisha's Candles" },
      { name: "description", content: "Choose a new password for your account." },
      { property: "og:title", content: "Set a new password — Tanvisha's Candles" },
      { property: "og:description", content: "Choose a new password for your account." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    if (pw !== pw2) return toast.error("Passwords don't match");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error("This reset link has expired. Please request a new one.");
    toast.success("Password updated");
    navigate({ to: "/" });
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <form onSubmit={submit} className="space-y-4 rounded-3xl border bg-card-gradient p-8 shadow-soft">
        <h1 className="text-3xl">Set a new password</h1>
        <div className="space-y-2"><Label htmlFor="np">New password</Label><Input id="np" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="np2">Confirm password</Label><Input id="np2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
        <Button size="lg" className="w-full" disabled={busy}>Update password</Button>
      </form>
    </div>
  );
}
