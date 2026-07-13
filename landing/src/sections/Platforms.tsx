import {PLATFORMS_LOGOS, PlatformGlyph, type Platform} from '../components/PlatformLogos';

function Card({p}: {p: Platform}) {
  return (
    <div
      style={{['--brand' as string]: p.color}}
      className="flex shrink-0 items-center gap-3.5 whitespace-nowrap rounded-2xl border border-line bg-ink-700/70 px-6 py-4 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--brand)] hover:shadow-[0_0_34px_-10px_var(--brand)]">
      <span
        className="grid h-9 w-9 place-items-center rounded-xl bg-ink-900/70"
        style={{color: p.color}}>
        <PlatformGlyph path={p.path} size={20} />
      </span>
      <span className="text-base font-bold tracking-tight text-frost">
        {p.name}
      </span>
    </div>
  );
}

function Row({items, reverse}: {items: Platform[]; reverse?: boolean}) {
  // Duplicate the set so the -50% translate loops seamlessly.
  const loop = [...items, ...items];
  return (
    <div className="mask-fade flex overflow-hidden py-1.5">
      <div
        className={`flex shrink-0 items-center gap-4 pr-4 hover:[animation-play-state:paused] ${
          reverse ? 'animate-marquee-reverse' : 'animate-marquee'
        }`}>
        {loop.map((p, i) => (
          <Card key={`${p.name}-${i}`} p={p} />
        ))}
      </div>
    </div>
  );
}

export default function Platforms() {
  const rowB = [...PLATFORMS_LOGOS].reverse();
  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      <div className="container-x">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="eyebrow">Works everywhere</span>
          <h2 className="text-balance font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            One engine, <span className="grad-text">every platform</span>
          </h2>
          <p className="max-w-xl text-mist">
            The same fast, reliable grab across nine of the biggest video and
            audio sites — with more added through updatable extractors.
          </p>
        </div>
      </div>

      <div className="mt-11 flex flex-col gap-4">
        <Row items={PLATFORMS_LOGOS} />
        <Row items={rowB} reverse />
      </div>
    </section>
  );
}
