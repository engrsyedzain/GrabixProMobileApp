# Grabix Pro — Landing Page

Marketing site for Grabix Pro (Windows desktop + Android). Built with **Vite +
React + TypeScript + Tailwind CSS**. It lives in a self-contained `landing/`
folder inside the mobile project so it never collides with the React Native
tooling at the repo root.

## Run it

```bash
cd landing
npm install
npm run dev      # local dev server (http://localhost:5173)
npm run build    # production build → landing/dist
npm run preview  # preview the production build
```

`npm run build` outputs a fully static site to `dist/` — host it anywhere
(Netlify, Vercel, GitHub Pages, Cloudflare Pages, or any static file server).

## What's on the page

- **Hero** with dual download CTAs (Windows desktop app + Android APK) and a live
  platform marquee.
- **Features grid** — the real capabilities pulled from the desktop app (multi-
  platform extraction, quality/format picker, audio, lossless MP4 remux,
  playlists, subtitles, live progress, browser extension, cross-platform).
- **How it works** — the URL → Format → Destination → Download workflow.
- **Download** section — Windows and Android platform cards.
- **Browser extension guide** — the four-step Chrome side-load + native-messaging
  pairing instructions.

## Editing content

- Download links, supported platforms, workflow steps and extension steps live in
  [`src/data.ts`](src/data.ts).
- Feature cards are in [`src/sections/Features.tsx`](src/sections/Features.tsx).
- Brand colors, fonts and animations are in [`tailwind.config.js`](tailwind.config.js).
