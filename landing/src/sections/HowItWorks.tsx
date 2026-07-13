import {WORKFLOW} from '../data';

export default function HowItWorks() {
  return (
    <section
      id="how"
      className="scroll-mt-20 border-y border-line/60 bg-ink-800/30 py-20 sm:py-28">
      <div className="container-x">
        <div className="max-w-2xl">
          <span className="eyebrow">How it works</span>
          <h2 className="mt-4 text-balance font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            From link to file in four steps
          </h2>
        </div>

        <ol className="mt-12 grid gap-4 md:grid-cols-4">
          {WORKFLOW.map((s, i) => (
            <li key={s.n} className="card relative p-6">
              <div className="flex items-baseline gap-3">
                <span className="grad-text font-display text-3xl font-extrabold">
                  {s.n}
                </span>
                {i < WORKFLOW.length - 1 && (
                  <span
                    className="hidden h-px flex-1 bg-gradient-to-r from-blue/40 to-transparent md:block"
                    aria-hidden="true"
                  />
                )}
              </div>
              <h3 className="mt-4 text-lg font-bold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
