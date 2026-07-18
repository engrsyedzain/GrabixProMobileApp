import {Monitor, Smartphone, ShieldCheck, Code2, Ban, EyeOff} from 'lucide-react';
import {WINDOWS_URL, ANDROID_URL} from '../data';

const HERO_BADGES = [
  {icon: Code2, label: '100% open source'},
  {icon: Ban, label: 'No ads, ever'},
  {icon: EyeOff, label: 'Nothing tracks you'},
];

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-[-10%] h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-blue/20 blur-[130px] animate-glowpulse"
        aria-hidden="true"
      />

      <div className="container-x relative grid items-center gap-14 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
        <div className="animate-risein">
          <span className="eyebrow">Powered by yt-dlp + FFmpeg</span>
          <h1 className="mt-4 text-balance font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
            Grab any video.
            <br />
            <span className="grad-text">Any platform.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-mist">
            Save video and audio from YouTube, TikTok, Instagram, Facebook, X and
            more. Pick your quality, keep it as MP4 or MP3 — no watermark, no
            account, no fuss.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href={WINDOWS_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-primary px-6 py-3.5 text-base">
              <Monitor size={20} />
              Download for Windows
            </a>
            <a
              href={ANDROID_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost px-6 py-3.5 text-base">
              <Smartphone size={20} />
              Android APK
            </a>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {HERO_BADGES.map(({icon: Icon, label}) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ink-700/70 px-3 py-1.5 text-xs font-semibold text-frost backdrop-blur-sm">
                <Icon size={14} className="text-blue" />
                {label}
              </span>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-2 text-sm text-haze">
            <ShieldCheck size={16} className="text-blue" />
            Free &middot; No watermark &middot; No sign-in &middot; Direct from
            source
          </div>
        </div>

        {/* App preview mock */}
        <div className="relative animate-float">
          <div className="card mx-auto max-w-sm overflow-hidden shadow-card">
            <div className="relative h-40 overflow-hidden bg-ink-800">
              <img
                src="https://picsum.photos/id/1018/800/450"
                alt="Sunrise over the Alps"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* legibility scrim for badges + play button */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/15 to-ink-900/25"
                aria-hidden="true"
              />
              <span className="absolute left-3 top-3 rounded-md border border-white/20 bg-black/50 px-2 py-1 font-mono text-[10px] text-white/90 backdrop-blur-sm">
                4:12
              </span>
              <span className="absolute right-3 top-3 rounded-md bg-grad px-2 py-1 font-mono text-[10px] font-bold text-ink-900">
                4K
              </span>
              <div className="absolute inset-0 grid place-items-center">
                <div className="grid h-12 w-12 place-items-center rounded-full border border-white/40 bg-black/40 text-white backdrop-blur-sm">
                  ▶
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="text-sm font-bold">Sunrise over the Alps</div>
              <div className="mt-0.5 text-xs text-mist">Aerial Nomad</div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-3 rounded-xl border border-blue/40 bg-blue/5 px-3 py-2.5">
                  <div className="text-sm font-semibold">1080p · Full HD</div>
                  <div className="ml-auto font-mono text-xs font-semibold text-blue">
                    ~48 MB
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-line bg-ink-800 px-3 py-2.5">
                  <div className="text-sm font-semibold text-mist">
                    MP3 · 320 kbps
                  </div>
                  <div className="ml-auto font-mono text-xs text-mist">
                    ~8.8 MB
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex justify-between font-mono text-[10px] text-mist">
                  <span>Merging tracks…</span>
                  <span>62%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-ink-600">
                  <div className="h-full w-[62%] rounded-full bg-grad" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
