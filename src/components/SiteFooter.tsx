import { Link } from "@tanstack/react-router";
import { Instagram, Mail } from "lucide-react";

export const INSTAGRAM_URL = "https://instagram.com/tanvishascandles";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-background/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <img src="/images/logo.webp" alt="Tanvisha's Candles logo" width={80} height={80} className="h-20 w-20 rounded-full" loading="lazy" />
          <p className="mt-4 font-script text-3xl text-bloom">Light up your moments</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">Small-batch soy candles, hand-poured with love in India.</p>
        </div>
        <div>
          <h3 className="font-brand text-sm text-primary">Explore</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/shop" className="hover:text-primary">Shop all</Link></li>
            <li><Link to="/about" className="hover:text-primary">Our story</Link></li>
            <li><Link to="/orders" className="hover:text-primary">Track my order</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-brand text-sm text-primary">Say hello</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-primary"><Instagram className="h-4 w-4" /> @tanvishascandles</a></li>
            <li><a href="mailto:hello@tanvishascandles.com" className="inline-flex items-center gap-2 hover:text-primary"><Mail className="h-4 w-4" /> hello@tanvishascandles.com</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Tanvisha's Candles · Cash on Delivery across India</div>
    </footer>
  );
}
