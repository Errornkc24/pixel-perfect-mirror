import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Heart, Instagram, Leaf, Quote, Sparkles } from "lucide-react";
import { AmbientBackground } from "@/components/AmbientBackground";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { INSTAGRAM_URL } from "@/components/SiteFooter";
import { categoriesQuery, productsQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tanvisha's Candles — Light up your moments" },
      { name: "description", content: "Hand-poured luxury soy candles in lavender, rose & oud, sandalwood and more. Cash on delivery across India." },
      { property: "og:title", content: "Tanvisha's Candles — Light up your moments" },
      { property: "og:description", content: "Hand-poured luxury soy candles, made in small batches in India." },
    ],
  }),
  component: Home,
});

const testimonials = [
  { name: "Priya S.", city: "Mumbai", text: "Lavender Moon is now part of my bedtime ritual. The scent fills the whole room without being overpowering." },
  { name: "Ananya R.", city: "Bengaluru", text: "Gifted Rose & Oud to my sister — the packaging felt so premium. She's already asked for another." },
  { name: "Meera K.", city: "Ahmedabad", text: "Cinnamon Chai smells exactly like monsoon evenings at home. Clean burn, lasts forever." },
];

function Section({ eyebrow, title, children, action }: { eyebrow: string; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
      <Reveal className="mb-10 flex flex-col items-center gap-3 text-center">
        <span className="font-brand text-xs tracking-[0.4em] text-primary">{eyebrow}</span>
        <h2 className="text-4xl sm:text-5xl">{title}</h2>
        <div className="gold-divider mt-2 w-32" />
      </Reveal>
      {children}
      {action && <div className="mt-10 flex justify-center">{action}</div>}
    </section>
  );
}

function Home() {
  const { data: products, isLoading } = useQuery(productsQuery);
  const { data: categories } = useQuery(categoriesQuery);
  const featured = (products ?? []).filter((p) => p.featured).slice(0, 4);
  const best = (products ?? []).filter((p) => p.bestseller).slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="relative -mt-16 overflow-hidden pt-16 sm:-mt-20 sm:pt-20">
        <div className="absolute inset-0">
          <img src="/images/hero.jpg" alt="" width={1600} height={1104} className="h-full w-full object-cover opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        </div>
        <AmbientBackground density={1.2} />
        <div className="relative mx-auto flex min-h-[86vh] max-w-7xl flex-col items-center justify-center px-6 py-20 text-center">
          <Sparkles className="animate-flicker h-6 w-6 text-primary" aria-hidden />
          <p className="mt-6 font-brand text-xs tracking-[0.5em] text-muted-foreground">HAND-POURED · SMALL BATCH · SOY WAX</p>
          <h1 className="mt-6 font-brand text-5xl leading-[1.05] text-gold sm:text-7xl lg:text-8xl">Tanvisha's</h1>
          <p className="mt-2 font-brand text-sm tracking-[0.8em] text-foreground/90 sm:text-base">CANDLES</p>
          <p className="mt-6 font-script text-4xl text-bloom sm:text-5xl">Light up your moments</p>
          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            Every candle begins in a tiny home studio — slow-melted soy, pure fragrance oils and a wish that your evenings feel a little softer.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg"><Link to="/shop">Shop the collection</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/about">Our story</Link></Button>
          </div>
        </div>
      </section>

      {/* Promises */}
      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 sm:grid-cols-3">
        {[
          { icon: Leaf, t: "100% soy wax", d: "Clean, slow, soot-free burn" },
          { icon: Flame, t: "40+ hour burn", d: "Cotton wicks, even melt pool" },
          { icon: Heart, t: "Made with love", d: "Hand-poured in small batches" },
        ].map((f, i) => (
          <Reveal key={f.t} delay={i * 120} className="flex items-center gap-4 rounded-2xl border bg-card/60 p-5 backdrop-blur">
            <f.icon className="h-8 w-8 shrink-0 text-primary" aria-hidden />
            <div><p className="font-display text-xl">{f.t}</p><p className="text-sm text-muted-foreground">{f.d}</p></div>
          </Reveal>
        ))}
      </section>

      <Section eyebrow="CURATED FOR YOU" title="Featured Candles" action={<Button asChild variant="outline"><Link to="/shop">View all candles</Link></Button>}>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {isLoading ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />) : featured.map((p, i) => <Reveal key={p.id} delay={i * 80}><ProductCard product={p} /></Reveal>)}
        </div>
      </Section>

      <Section eyebrow="FIND YOUR MOOD" title="Shop by Scent">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {(categories ?? []).map((c, i) => (
            <Reveal key={c.id} delay={i * 80}>
              <Link to="/shop" search={{ category: c.slug }} className="group relative block aspect-[3/4] overflow-hidden rounded-2xl border">
                <img src={c.image_url ?? ""} alt={`${c.name} candles`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-display text-2xl">{c.name}</p>
                  <p className="text-sm text-muted-foreground">{c.description}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section eyebrow="LOVED BY MANY" title="Best Sellers">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {isLoading ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />) : best.map((p, i) => <Reveal key={p.id} delay={i * 80}><ProductCard product={p} /></Reveal>)}
        </div>
      </Section>

      {/* About */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
        <Reveal><img src="/images/about.jpg" alt="Hand-pouring soy wax into glass jars in our home studio" loading="lazy" width={1200} height={1200} className="rounded-3xl border shadow-soft" /></Reveal>
        <Reveal delay={150}>
          <span className="font-brand text-xs tracking-[0.4em] text-primary">OUR STORY</span>
          <h2 className="mt-3 text-4xl sm:text-5xl">Born from quiet evenings</h2>
          <p className="mt-5 text-muted-foreground">Tanvisha's began at a kitchen table with a single pot of wax and a love for the way a candle can change a room. Today, every jar is still poured by hand, cured for two weeks and checked before it reaches you.</p>
          <p className="mt-4 text-muted-foreground">We use natural soy wax, lead-free cotton wicks and fragrances inspired by Indian gardens, temples and monsoon kitchens.</p>
          <Button asChild variant="outline" className="mt-8"><Link to="/about">Read more</Link></Button>
        </Reveal>
      </section>

      <Section eyebrow="KIND WORDS" title="From Our Candle Family">
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 120} className="rounded-2xl border bg-card-gradient p-7">
              <Quote className="h-6 w-6 text-primary" aria-hidden />
              <p className="mt-4 font-display text-xl italic leading-relaxed">“{t.text}”</p>
              <p className="mt-5 text-sm text-muted-foreground">{t.name} · {t.city}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      <section className="mx-auto max-w-4xl px-6">
        <Reveal className="relative overflow-hidden rounded-3xl border bg-card-gradient p-10 text-center sm:p-14">
          <AmbientBackground density={0.5} />
          <Instagram className="relative mx-auto h-10 w-10 text-primary" aria-hidden />
          <h2 className="relative mt-4 text-4xl">Join us on Instagram</h2>
          <p className="relative mt-3 text-muted-foreground">Behind-the-scenes pours, new scent drops and cozy corners.</p>
          <Button asChild size="lg" className="relative mt-8"><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">@tanvishascandles</a></Button>
        </Reveal>
      </section>
    </>
  );
}
