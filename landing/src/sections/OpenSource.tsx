import {
  Github,
  Code2,
  Ban,
  ShieldCheck,
  Smartphone,
  Monitor,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react';
import {GITHUB_MOBILE_URL, GITHUB_DESKTOP_URL} from '../data';

const POINTS: {icon: LucideIcon; title: string; body: string}[] = [
  {
    icon: Code2,
    title: '100% open source',
    body: 'Both apps are public on GitHub. Read the code, audit it, or build it from source yourself — no need to take our word for it.',
  },
  {
    icon: Ban,
    title: 'No ads, ever',
    body: 'No banners, no interstitials, no sponsored links. Nothing stands between you and your download.',
  },
  {
    icon: ShieldCheck,
    title: 'Nothing tracks you',
    body: 'No accounts, no analytics, no telemetry. What you grab never leaves your device.',
  },
];

const REPOS: {icon: LucideIcon; kicker: string; name: string; repo: string; href: string}[] = [
  {
    icon: Smartphone,
    kicker: 'Android app',
    name: 'GrabixProMobileApp',
    repo: 'engrsyedzain/GrabixProMobileApp',
    href: GITHUB_MOBILE_URL,
  },
  {
    icon: Monitor,
    kicker: 'Desktop app',
    name: 'Grabix-Pro-Desktop',
    repo: 'engrsyedzain/Grabix-Pro-Desktop',
    href: GITHUB_DESKTOP_URL,
  },
];

export default function OpenSource() {
  return (
    <section id="open-source" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Open source &amp; ad-free</span>
          <h2 className="mt-4 text-balance font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            The code is <span className="grad-text">yours to read</span>
          </h2>
          <p className="mt-4 text-lg text-mist">
            Grabix Pro is 100% open source and completely ad-free. Every line of
            both apps is public on GitHub, so you can verify exactly what it does
            before you ever hit download.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {POINTS.map(({icon: Icon, title, body}) => (
            <article key={title} className="card p-6">
              <div className="grid h-12 w-12 place-items-center rounded-xl border border-blue/25 bg-grad-soft text-blue">
                <Icon size={22} />
              </div>
              <h3 className="mt-5 text-lg font-bold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist">{body}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {REPOS.map(({icon: Icon, kicker, name, repo, href}) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="card group flex items-center gap-4 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-blue/40 hover:shadow-glow">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-blue/25 bg-ink-700 text-frost transition-colors group-hover:text-blue">
                <Github size={26} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-haze">
                  <Icon size={13} />
                  {kicker}
                </div>
                <div className="mt-1 text-lg font-bold tracking-tight">{name}</div>
                <div className="truncate font-mono text-xs text-mist">{repo}</div>
              </div>
              <span className="ml-auto inline-flex items-center gap-1 self-start text-sm font-semibold text-blue">
                View
                <ArrowUpRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
