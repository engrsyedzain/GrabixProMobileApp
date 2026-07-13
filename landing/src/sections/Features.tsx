import {
  Globe,
  Share2,
  Scissors,
  SlidersHorizontal,
  Music,
  ListVideo,
  Captions,
  PlayCircle,
  Zap,
  RefreshCw,
  Smartphone,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
  badge?: string;
}

const FEATURES: Feature[] = [
  {
    icon: Globe,
    title: 'Nine platforms, one app',
    body: 'YouTube, TikTok, Instagram, Facebook, X, Vimeo, Twitch, Dailymotion and Bilibili — all handled by the same reliable engine.',
  },
  {
    icon: Share2,
    title: 'Share straight from any app',
    body: 'Tap Share on a YouTube, TikTok or Instagram post and pick Grabix Pro — the link opens in the app ready to grab. No copy-paste.',
    badge: 'New on Android',
  },
  {
    icon: Scissors,
    title: 'Trim before you download',
    body: 'Drag a visual range slider to set exact start and end points and save just the clip you want, instead of the whole video.',
    badge: 'New on Android',
  },
  {
    icon: SlidersHorizontal,
    title: 'Your quality, your call',
    body: 'Grab MP4 from 4K down to SD. Set a default quality once, or have the app ask every time so you choose per video.',
  },
  {
    icon: Music,
    title: 'Audio in a tap',
    body: 'Rip just the sound as a 320 kbps MP3 or an M4A (AAC) — perfect for music, podcasts, and ringtones.',
  },
  {
    icon: ListVideo,
    title: 'Playlists & a download queue',
    body: 'Pick videos from a whole playlist and let them run through the queue, several at a time. Set it going and walk away.',
  },
  {
    icon: Captions,
    title: 'Subtitles, one clean copy',
    body: 'Optionally pull subtitles and auto-captions alongside the video — de-duplicated to a single English track, embedded in the file.',
  },
  {
    icon: PlayCircle,
    title: 'Built-in player',
    body: 'Play anything you have grabbed right inside the app, and search or sort your whole library — no hunting through the gallery.',
    badge: 'New on Android',
  },
  {
    icon: Zap,
    title: 'Lossless merge, instant play',
    body: 'Bundled FFmpeg merges video and audio and remuxes to MP4 without re-encoding — with fast-start so it plays the moment it lands.',
  },
  {
    icon: RefreshCw,
    title: 'Always up to date',
    body: 'A single tap updates the download engine in-app, so fixes for site changes arrive without waiting on a full app update.',
    badge: 'New on Android',
  },
  {
    icon: Smartphone,
    title: 'Downloads that finish themselves',
    body: 'Grabs keep running in the background and survive the app closing, then drop straight into your gallery when they are done.',
    badge: 'New on Android',
  },
  {
    icon: ShieldCheck,
    title: 'Private by design',
    body: 'No accounts, no watermarks, no analytics, no telemetry. The only traffic is to the video source and for engine updates.',
  },
];

export default function Features() {
  return (
    <section id="features" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-x">
        <div className="max-w-2xl">
          <span className="eyebrow">Why Grabix Pro</span>
          <h2 className="mt-4 text-balance font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Built to grab, keep, and enjoy media
          </h2>
          <p className="mt-4 text-lg text-mist">
            Everything Grabix Pro does on Windows and Android, laid out plainly —
            now with a batch of fresh Android upgrades. No trial walls, no
            watermarks, no telemetry — just the download.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({icon: Icon, title, body, badge}) => (
            <article
              key={title}
              className="card group p-6 transition-all duration-200 hover:-translate-y-1 hover:border-blue/40 hover:shadow-glow">
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl border border-blue/25 bg-grad-soft text-blue transition-colors group-hover:text-cyan">
                  <Icon size={22} />
                </div>
                {badge && (
                  <span className="rounded-full border border-cyan/30 bg-cyan/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cyan">
                    {badge}
                  </span>
                )}
              </div>
              <h3 className="mt-5 text-lg font-bold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
