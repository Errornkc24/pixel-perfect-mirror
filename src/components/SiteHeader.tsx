import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, Package, ShoppingBag, User, LogOut, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "Our Story" },
] as const;

export function SiteHeader() {
  const { count, setOpen, bump } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [pop, setPop] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!bump) return;
    setPop(true);
    const t = setTimeout(() => setPop(false), 500);
    return () => clearTimeout(t);
  }, [bump]);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 10);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  async function signOut() {
    await qc.cancelQueries();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className={cn("sticky top-0 z-40 transition-all duration-500", scrolled ? "border-b bg-background/85 backdrop-blur-md" : "bg-transparent")}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
        <Sheet>
          <SheetTrigger className="md:hidden" aria-label="Open menu"><Menu className="h-6 w-6" /></SheetTrigger>
          <SheetContent side="left" className="bg-background">
            <SheetTitle className="font-brand text-gold">Tanvisha's</SheetTitle>
            <nav className="mt-8 flex flex-col gap-5 font-display text-2xl">
              {nav.map((n) => <Link key={n.to} to={n.to} className="hover:text-primary">{n.label}</Link>)}
              <Link to="/orders" className="hover:text-primary">My Orders</Link>
              <Link to="/account" className="hover:text-primary">Account</Link>
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-center gap-3" aria-label="Tanvisha's Candles home">
          <img src="/images/logo.webp" alt="" width={44} height={44} className="h-10 w-10 rounded-full ring-1 ring-primary/40 sm:h-11 sm:w-11" />
          <span className="hidden leading-none sm:block">
            <span className="block font-brand text-lg text-gold">TANVISHA'S</span>
            <span className="block text-[10px] tracking-[0.5em] text-muted-foreground">CANDLES</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm uppercase tracking-[0.2em] md:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }} className="text-muted-foreground transition-colors hover:text-primary data-[status=active]:text-primary">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link to="/shop" className="grid h-10 w-10 place-items-center rounded-full hover:bg-accent/60" aria-label="Search candles"><Search className="h-5 w-5" /></Link>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="grid h-10 w-10 place-items-center rounded-full hover:bg-accent/60" aria-label="Account menu"><User className="h-5 w-5" /></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="truncate text-xs text-muted-foreground">{user.email ?? user.phone}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/account" })}><User /> My account</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/orders" })}><Package /> My orders</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}><LogOut /> Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth" className="hidden rounded-full px-3 py-2 text-sm hover:text-primary sm:block">Sign in</Link>
          )}
          <button onClick={() => setOpen(true)} className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-accent/60" aria-label={`Open cart, ${count} items`}>
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className={cn("absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-semibold text-primary-foreground", pop && "animate-cart-pop")}>
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
