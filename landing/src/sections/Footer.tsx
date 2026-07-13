import {Monitor, Smartphone} from 'lucide-react';
import Logo from '../components/Logo';
import {WINDOWS_URL, ANDROID_URL} from '../data';

export default function Footer() {
  return (
    <footer className="border-t border-line/60 py-14">
      <div className="container-x">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <Logo size={32} />
              <span className="text-lg font-extrabold tracking-tight">
                Grabix <span className="grad-text">Pro</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-mist">
              A fast, private media downloader for Windows and Android. Powered by
              the industry-standard yt-dlp engine and FFmpeg.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['yt-dlp', 'FFmpeg', 'React', 'Rust / Tauri'].map(t => (
                <span
                  key={t}
                  className="rounded-full border border-line bg-ink-700 px-3 py-1 font-mono text-[11px] text-mist">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={WINDOWS_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost px-5 py-3 text-sm">
              <Monitor size={18} />
              Windows App
            </a>
            <a
              href={ANDROID_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost px-5 py-3 text-sm">
              <Smartphone size={18} />
              Android APK
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line/60 pt-6 text-xs text-haze sm:flex-row sm:items-center sm:justify-between">
          <p>
            © 2025 Grabix Pro. Crafted by{' '}
            <span className="font-bold text-mist">ZAIN</span>. All rights reserved.
          </p>
          <p className="max-w-md sm:text-right">
            Please download only content you own or have permission to save, and
            respect each platform’s terms of service.
          </p>
        </div>
      </div>
    </footer>
  );
}
