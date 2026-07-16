import {
  FolderSearch,
  ToggleRight,
  Upload,
  Plug,
  Puzzle,
  KeyRound,
  FileDown,
  ShieldCheck,
} from 'lucide-react';
import {CHROME_STEPS, FIREFOX_STEPS, type ExtensionStep} from '../data';

const FIREFOX_ICONS = [Puzzle, FileDown, Plug];
const CHROME_ICONS = [ToggleRight, FolderSearch, KeyRound, Upload];

type StepsProps = {
  steps: ExtensionStep[];
  icons: typeof FIREFOX_ICONS;
};

function Steps({steps, icons}: StepsProps) {
  return (
    <ol className="relative space-y-4 before:absolute before:left-[27px] before:top-4 before:bottom-4 before:w-px before:bg-gradient-to-b before:from-blue/40 before:to-transparent">
      {steps.map((step, i) => {
        const Icon = icons[i];
        return (
          <li key={step.title} className="relative flex gap-5">
            <div className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-blue/25 bg-ink-700 text-blue shadow-card">
              <Icon size={22} />
              <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-grad font-mono text-xs font-extrabold text-ink-900">
                {i + 1}
              </span>
            </div>
            <div className="card flex-1 p-5">
              <h4 className="text-lg font-bold tracking-tight">{step.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-mist">
                {step.body}
              </p>
              {step.note && (
                <code className="mt-3 inline-block select-all rounded-lg border border-line bg-ink-900 px-3 py-1.5 font-mono text-xs text-blue-soft">
                  {step.note}
                </code>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function Extension() {
  return (
    <section
      id="extension"
      className="scroll-mt-20 border-t border-line/60 bg-ink-800/30 py-20 sm:py-28">
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Intro + visual */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <span className="eyebrow">Browser extension</span>
            <h2 className="mt-4 text-balance font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              One-click grabs in Firefox and Chrome
            </h2>
            <p className="mt-4 text-lg text-mist">
              The companion extension ships inside the desktop app. Add it once
              and a Download button appears on every supported video — each grab
              is handed to Grabix Pro automatically.
            </p>

            <div className="card mt-8 p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg border border-blue/25 bg-grad-soft text-blue">
                  <Puzzle size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold">GrabixPro Downloader</div>
                  <div className="truncate text-xs text-mist">
                    Adds a download button to supported sites
                  </div>
                </div>
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-blue/30 bg-blue/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-blue">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue animate-glowpulse" />
                  Paired
                </span>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-haze">
                Communicates with the running desktop client over native
                messaging — no servers, nothing leaves your machine.
              </p>
            </div>

            <div className="card mt-4 flex items-start gap-3 p-5">
              <div className="mt-0.5 shrink-0 text-cyan">
                <ShieldCheck size={18} />
              </div>
              <p className="text-xs leading-relaxed text-haze">
                <span className="font-bold text-frost">
                  Signed by Mozilla.
                </span>{' '}
                The Firefox add-on is reviewed and signed, so it installs
                permanently in two clicks — no developer mode, and nothing to
                re-add when you restart the browser.
              </p>
            </div>
          </div>

          {/* Per-browser steps: the two flows genuinely differ, so showing one
              generic list would leave Chrome users stuck at "Disconnected". */}
          <div className="space-y-12">
            <div>
              <div className="mb-5 flex items-baseline gap-3">
                <h3 className="font-display text-2xl font-extrabold tracking-tight">
                  Firefox
                </h3>
                <span className="text-sm text-haze">
                  signed add-on · two clicks
                </span>
              </div>
              <Steps steps={FIREFOX_STEPS} icons={FIREFOX_ICONS} />
            </div>

            <div>
              <div className="mb-5 flex items-baseline gap-3">
                <h3 className="font-display text-2xl font-extrabold tracking-tight">
                  Chrome, Edge &amp; Brave
                </h3>
                <span className="text-sm text-haze">
                  load unpacked · pair with an ID
                </span>
              </div>
              <Steps steps={CHROME_STEPS} icons={CHROME_ICONS} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
