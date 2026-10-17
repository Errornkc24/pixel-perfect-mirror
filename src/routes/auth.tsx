import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const safePath = (p?: string) => (p && p.startsWith("/") && !p.startsWith("//") ? p : "/");

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Tanvisha's Candles" },
      { name: "description", content: "Sign in or create your Tanvisha's Candles account." },
      { property: "og:title", content: "Sign in — Tanvisha's Candles" },
      { property: "og:description", content: "Sign in or create your account." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Please enter a valid email").max(255);
const pwSchema = z.string().min(8, "Password must be at least 8 characters").max(72);

function GoogleButton() {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
        if (r.error) {
          toast.error("Google sign-in didn't work. Please try again.");
          setBusy(false);
        }
      }}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden><path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.7 3.74 14.56 2.8 12 2.8 6.93 2.8 2.8 6.93 2.8 12s4.13 9.2 9.2 9.2c5.31 0 8.83-3.73 8.83-8.99 0-.6-.07-1.06-.15-1.51z" /></svg>
      Continue with Google
    </Button>
  );
}

function CodeStep({ email, type, onBack }: { email: string; type: "email" | "signup"; onBack: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  async function verify() {
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type });
    setBusy(false);
    if (error) toast.error("That code didn't work. Check it and try again.");
  }
  return (
    <div className="space-y-5 text-center">
      <p className="text-sm text-muted-foreground">We sent a code to <span className="text-foreground">{email}</span>. Enter it below, or tap the link in the email.</p>
      <div className="flex justify-center">
        <InputOTP maxLength={8} value={code} onChange={setCode}>
          <InputOTPGroup>{Array.from({ length: 6 }).map((_, i) => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
        </InputOTP>
      </div>
      <Button size="lg" className="w-full" disabled={code.length < 6 || busy} onClick={verify}>Verify & continue</Button>
      <button onClick={onBack} className="text-sm text-muted-foreground hover:text-primary">Use a different email</button>
    </div>
  );
}

function AuthPage() {
  const { redirect } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [codeFor, setCodeFor] = useState<null | "email" | "signup">(null);
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("tc-after-auth");
    if (redirect) sessionStorage.setItem("tc-after-auth", safePath(redirect));
    if (user) {
      sessionStorage.removeItem("tc-after-auth");
      navigate({ to: safePath(redirect ?? stored ?? "/"), replace: true });
    }
  }, [user, redirect, navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const em = emailSchema.safeParse(email);
    if (!em.success) return toast.error(em.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: em.data, password });
    setBusy(false);
    if (error) toast.error(error.message.includes("confirm") ? "Please verify your email first." : "Incorrect email or password.");
  }

  async function sendCode() {
    const em = emailSchema.safeParse(email);
    if (!em.success) return toast.error(em.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email: em.data, options: { emailRedirectTo: window.location.origin + "/auth" } });
    setBusy(false);
    if (error) return toast.error("Couldn't send the code. Please try again in a minute.");
    setCodeFor("email");
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    const em = emailSchema.safeParse(email);
    const pw = pwSchema.safeParse(password);
    if (!first.trim()) return toast.error("Please enter your first name");
    if (!em.success) return toast.error(em.error.issues[0].message);
    if (!pw.success) return toast.error(pw.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: em.data,
      password: pw.data,
      options: { emailRedirectTo: window.location.origin + "/auth", data: { first_name: first.trim().slice(0, 60), last_name: last.trim().slice(0, 60) } },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setCodeFor("signup");
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    const em = emailSchema.safeParse(email);
    if (!em.success) return toast.error(em.error.issues[0].message);
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(em.data, { redirectTo: window.location.origin + "/reset-password" });
    setBusy(false);
    toast.success("If that email has an account, a reset link is on its way.");
    setForgot(false);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-5 py-12">
      <div className="text-center">
        <img src="/images/logo.webp" alt="" width={80} height={80} className="mx-auto h-20 w-20 rounded-full" />
        <h1 className="mt-4 text-4xl">Welcome</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to place orders and track deliveries. Your cart stays with you.</p>
      </div>
      <div className="mt-8 rounded-3xl border bg-card-gradient p-6 shadow-soft sm:p-8">
        {codeFor ? (
          <CodeStep email={email} type={codeFor} onBack={() => setCodeFor(null)} />
        ) : forgot ? (
          <form onSubmit={sendReset} className="space-y-4">
            <h2 className="text-2xl">Reset your password</h2>
            <div className="space-y-2"><Label htmlFor="re">Email</Label><Input id="re" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <Button size="lg" className="w-full" disabled={busy}>Send reset link</Button>
            <button type="button" onClick={() => setForgot(false)} className="w-full text-sm text-muted-foreground hover:text-primary">Back to sign in</button>
          </form>
        ) : (
          <>
            <GoogleButton />
            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" /></div>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-3 rounded-full bg-muted">
                <TabsTrigger value="signin" className="rounded-full">Password</TabsTrigger>
                <TabsTrigger value="code" className="rounded-full">Email code</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-full">Sign up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={signIn} className="mt-5 space-y-4">
                  <div className="space-y-2"><Label htmlFor="e1">Email</Label><Input id="e1" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                  <div className="space-y-2"><Label htmlFor="p1">Password</Label><Input id="p1" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                  <Button size="lg" className="w-full" disabled={busy}>Sign in</Button>
                  <button type="button" onClick={() => setForgot(true)} className="w-full text-sm text-muted-foreground hover:text-primary">Forgot password?</button>
                </form>
              </TabsContent>
              <TabsContent value="code">
                <div className="mt-5 space-y-4">
                  <p className="text-sm text-muted-foreground">No password needed — we'll email you a one-time code.</p>
                  <div className="space-y-2"><Label htmlFor="e2">Email</Label><Input id="e2" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                  <Button size="lg" className="w-full" disabled={busy} onClick={sendCode}>Email me a code</Button>
                </div>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={signUp} className="mt-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label htmlFor="fn">First name</Label><Input id="fn" value={first} onChange={(e) => setFirst(e.target.value)} required /></div>
                    <div className="space-y-2"><Label htmlFor="ln">Last name</Label><Input id="ln" value={last} onChange={(e) => setLast(e.target.value)} /></div>
                  </div>
                  <div className="space-y-2"><Label htmlFor="e3">Email</Label><Input id="e3" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                  <div className="space-y-2"><Label htmlFor="p3">Password</Label><Input id="p3" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                  <Button size="lg" className="w-full" disabled={busy}>Create account</Button>
                </form>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
      <Link to="/shop" className="mt-6 text-center text-sm text-muted-foreground hover:text-primary">Continue browsing</Link>
    </div>
  );
}
