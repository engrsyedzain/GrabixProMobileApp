import {Monitor, Smartphone, Download, Check} from 'lucide-react';
import {WINDOWS_URL, ANDROID_URL} from '../data';

const WIN_POINTS = [
  'Full desktop client with playlists & batch',
  'Browser extension for one-click grabs',
  'Live speed, ETA and download history',
];
const AND_POINTS = [
  'Lightweight APK, saves straight to your gallery',
  'Share a video to Grabix Pro, or paste a link',
  'Self-updating engine keeps sites working',
];

export default function Downloads() {
  return (
    <section id="download" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Get Grabix Pro</span>
          <h2 className="mt-4 text-balance font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Download for your device
          </h2>
          <p className="mt-4 text-lg text-mist">
            Free to install. Pick your platform and start grabbing in minutes.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <PlatformCard
            icon={<Monitor size={26} />}
            kicker="Windows 10 & 11"
            title="Desktop App"
            points={WIN_POINTS}
            href={WINDOWS_URL}
            cta="Download for Windows"
            primary
          />
          <PlatformCard
            icon={<Smartphone size={26} />}
            kicker="Android 7.0+"
            title="Mobile APK"
            points={AND_POINTS}
            href={ANDROID_URL}
            cta="Download Android APK"
          />
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-haze">
          Downloads are hosted on Dropbox. On Android, enable “Install unknown
          apps” for your browser or file manager to sideload the APK.
        </p>
      </div>
    </section>
  );
}

function PlatformCard({
  icon,
  kicker,
  title,
  points,
  href,
  cta,
  primary,
}: {
  icon: React.ReactNode;
  kicker: string;
  title: string;
  points: string[];
  href: string;
  cta: string;
  primary?: boolean;
}) {
  return (
    <div
      className={`card relative overflow-hidden p-8 ${
        primary ? 'ring-1 ring-blue/30' : ''
      }`}>
      {primary && (
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue/20 blur-3xl"
          aria-hidden="true"
        />
      )}
      <div className="relative flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-blue/25 bg-grad-soft text-blue">
          {icon}
        </div>
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-haze">
            {kicker}
          </div>
          <div className="text-2xl font-extrabold tracking-tight">{title}</div>
        </div>
      </div>

      <ul className="relative mt-6 space-y-3">
        {points.map(p => (
          <li key={p} className="flex items-start gap-3 text-sm text-mist">
            <Check size={18} className="mt-0.5 shrink-0 text-blue" />
            <span>{p}</span>
          </li>
        ))}
      </ul>

      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={`mt-8 w-full px-6 py-3.5 text-base ${
          primary ? 'btn-primary' : 'btn-ghost'
        }`}>
        <Download size={20} />
        {cta}
      </a>
    </div>
  );
}
