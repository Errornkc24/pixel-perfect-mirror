import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

export const addressSchema = z.object({
  full_name: z.string().trim().min(2, "Enter the recipient's name").max(100),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  line1: z.string().trim().min(5, "Enter the full address").max(300),
  landmark: z.string().trim().max(120).optional().default(""),
  city: z.string().trim().min(2, "Enter the city").max(80),
  state: z.string().trim().min(2, "Enter the state").max(80),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit pincode"),
});
export type AddressInput = z.infer<typeof addressSchema>;

const empty: AddressInput = { full_name: "", phone: "", line1: "", landmark: "", city: "", state: "", pincode: "" };

export function AddressForm({ initial, onSubmit, submitLabel = "Save address", onCancel }: { initial?: Partial<AddressInput>; onSubmit: (a: AddressInput) => Promise<void> | void; submitLabel?: string; onCancel?: () => void }) {
  const [v, setV] = useState<AddressInput>({ ...empty, ...initial } as AddressInput);
  const [busy, setBusy] = useState(false);
  const f = (k: keyof AddressInput) => ({ id: `addr-${k}`, value: v[k] ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value }) });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = addressSchema.safeParse(v);
    if (!r.success) return toast.error(r.error.issues[0].message);
    setBusy(true);
    try { await onSubmit(r.data); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="addr-full_name">Full name</Label><Input {...f("full_name")} autoComplete="name" /></div>
      <div className="space-y-2"><Label htmlFor="addr-phone">Mobile number</Label><Input {...f("phone")} inputMode="numeric" autoComplete="tel-national" placeholder="10 digits" /></div>
      <div className="space-y-2 sm:col-span-2"><Label htmlFor="addr-line1">Address (house, street, area)</Label><Input {...f("line1")} autoComplete="street-address" /></div>
      <div className="space-y-2 sm:col-span-2"><Label htmlFor="addr-landmark">Landmark <span className="text-muted-foreground">(optional)</span></Label><Input {...f("landmark")} /></div>
      <div className="space-y-2"><Label htmlFor="addr-city">City</Label><Input {...f("city")} autoComplete="address-level2" /></div>
      <div className="space-y-2"><Label htmlFor="addr-state">State</Label><Input {...f("state")} autoComplete="address-level1" /></div>
      <div className="space-y-2"><Label htmlFor="addr-pincode">Pincode</Label><Input {...f("pincode")} inputMode="numeric" autoComplete="postal-code" /></div>
      <div className="flex items-end gap-2 sm:col-span-2">
        <Button disabled={busy}>{submitLabel}</Button>
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
