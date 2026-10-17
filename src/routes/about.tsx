import { createFileRoute, Link } from "@tanstack/react-router";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — Tanvisha's Candles" },
      { name: "description", content: "How Tanvisha's Candles began: hand-poured soy candles made in small batches with love." },
      { property: "og:title", content: "Our Story — Tanvisha's Candles" },
      { property: "og:description", content: "Hand-poured soy candles made in small batches with love." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <Reveal className="text-center">
        <span className="font-brand text-xs tracking-[0.4em] text-primary">OUR STORY</span>
        <h1 className="mt-3 text-5xl sm:text-6xl">Light, slowly made</h1>
        <p className="mt-4 font-script text-4xl text-bloom">Light up your moments</p>
      </Reveal>
      <Reveal className="mt-12"><img src="/images/about.jpg" alt="Pouring candles in the studio" className="w-full rounded-3xl border object-cover shadow-soft sm:max-h-[520px]" /></Reveal>
      <div className="mx-auto mt-12 max-w-2xl space-y-6 text-lg text-muted-foreground">
        <Reveal><p>Tanvisha's Candles started as a way to unwind after long days — melting wax, testing fragrances, and filling our home with light. Friends asked for one, then their friends did too.</p></Reveal>
        <Reveal><p>Every candle is hand-poured using 100% natural soy wax and lead-free cotton wicks, then cured for two weeks so the fragrance blooms fully when lit.</p></Reveal>
        <Reveal><p>Our scents are inspired by the places we love: mogra garlands, temple sandalwood, masala chai on rainy evenings, and lavender fields under a crescent moon.</p></Reveal>
      </div>
      <div className="mt-12 flex justify-center"><Button asChild size="lg"><Link to="/shop">Find your scent</Link></Button></div>
    </div>
  );
}
