import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Particle = { x: number; y: number; r: number; vx: number; vy: number; a: number; phase: number; rot: number; vr: number; kind: "ember" | "petal" };

/** Floating embers + drifting petals. Static under reduced motion; pauses when tab hidden. */
export function AmbientBackground({ density = 1, className, fixed = false }: { density?: number; className?: string; fixed?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0, h = 0, raf = 0, running = true;
    let particles: Particle[] = [];

    const make = (initial: boolean): Particle => {
      const petal = Math.random() < 0.3;
      return {
        kind: petal ? "petal" : "ember",
        x: Math.random() * w,
        y: initial ? Math.random() * h : petal ? -10 : h + 10,
        r: petal ? 3 + Math.random() * 4 : 0.8 + Math.random() * 1.8,
        vx: (Math.random() - 0.5) * 0.25,
        vy: petal ? 0.15 + Math.random() * 0.3 : -(0.15 + Math.random() * 0.35),
        a: 0.25 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.01,
      };
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const mobile = w < 640;
      const n = Math.round((mobile ? 22 : 45) * density);
      particles = Array.from({ length: n }, () => make(true));
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        const flicker = 0.6 + 0.4 * Math.sin(t / 600 + p.phase);
        if (p.kind === "ember") {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
          g.addColorStop(0, `rgba(255, 210, 130, ${p.a * flicker})`);
          g.addColorStop(1, "rgba(255, 170, 80, 0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = `rgba(222, 160, 200, ${p.a * 0.55})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    };

    const step = (t: number) => {
      if (!running) return;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx + Math.sin(t / 2000 + p.phase) * 0.15;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y < -20 || p.y > h + 20 || p.x < -20 || p.x > w + 20) particles[i] = make(false);
      }
      draw(t);
      raf = requestAnimationFrame(step);
    };

    resize();
    if (reduce) draw(0);
    else raf = requestAnimationFrame(step);

    const onVis = () => {
      if (reduce) return;
      running = !document.hidden;
      if (running) raf = requestAnimationFrame(step);
      else cancelAnimationFrame(raf);
    };
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [density]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={cn("pointer-events-none inset-0 h-full w-full", fixed ? "fixed -z-10" : "absolute", className)}
    />
  );
}
