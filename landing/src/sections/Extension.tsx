import {FolderSearch, ToggleRight, Upload, Plug, Puzzle} from 'lucide-react';
import {EXTENSION_STEPS} from '../data';

const ICONS = [FolderSearch, ToggleRight, Upload, Plug];

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
              One-click grabs, right in Chrome
            </h2>
            <p className="mt-4 text-lg text-mist">
              The companion extension ships inside the desktop app. Side-load it
              once and a Download button appears on every supported video — each
              grab is handed to Grabix Pro automatically.
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
                Communicates with the running desktop client over Chrome native
                messaging — no servers, nothing leaves your machine.
              </p>
            </div>
          </div>

          {/* Numbered steps */}
          <ol className="relative space-y-4 before:absolute before:left-[27px] before:top-4 before:bottom-4 before:w-px before:bg-gradient-to-b before:from-blue/40 before:to-transparent">
            {EXTENSION_STEPS.map((step, i) => {
              const Icon = ICONS[i];
              return (
                <li key={step.title} className="relative flex gap-5">
                  <div className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-blue/25 bg-ink-700 text-blue shadow-card">
                    <Icon size={22} />
                    <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-grad font-mono text-xs font-extrabold text-ink-900">
                      {i + 1}
                    </span>
                  </div>
                  <div className="card flex-1 p-5">
                    <h3 className="text-lg font-bold tracking-tight">
                      {step.title}
                    </h3>
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
        </div>
      </div>
    </section>
  );
}
