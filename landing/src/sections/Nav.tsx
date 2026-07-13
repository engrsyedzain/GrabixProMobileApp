import {Download} from 'lucide-react';
import Logo from '../components/Logo';
import {ANDROID_URL} from '../data';

const LINKS = [
  {label: 'Features', href: '#features'},
  {label: 'How it works', href: '#how'},
  {label: 'Download', href: '#download'},
  {label: 'Extension', href: '#extension'},
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-ink-900/80 backdrop-blur-md">
      <nav className="container-x flex h-16 items-center gap-4">
        <a href="#top" className="flex items-center gap-2.5">
          <Logo size={34} />
          <span className="text-lg font-extrabold tracking-tight">
            Grabix <span className="grad-text">Pro</span>
          </span>
        </a>

        <ul className="ml-6 hidden items-center gap-7 md:flex">
          {LINKS.map(l => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm font-medium text-mist transition-colors hover:text-frost">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href={ANDROID_URL}
          target="_blank"
          rel="noreferrer"
          className="btn-primary ml-auto px-4 py-2 text-sm">
          <Download size={16} />
          Get the app
        </a>
      </nav>
    </header>
  );
}
