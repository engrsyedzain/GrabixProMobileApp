# Grabix Pro

A fast, private media downloader for **Android** and **Windows**. Paste a link — or share one straight from another app — pick your quality, and keep the file.

### ➡️ Download from **[grabix-pro.vercel.app](https://grabix-pro.vercel.app/)**

Grabix Pro saves video and audio from YouTube, TikTok, Instagram, Facebook, X, Vimeo, Twitch, Dailymotion, Bilibili and hundreds of other sites — as MP4, MP3 or M4A. No account, no watermark, no trial wall.

**It is fully offline by design.** There is no backend, no analytics and no telemetry. The only network traffic is to the video platform you are downloading from, and to GitHub when you choose to update the download engine.

---

## Downloads

| Platform | File | Notes |
| --- | --- | --- |
| Android | `GrabixPro-arm64-v8a.apk` | Most phones from ~2017 onward (64-bit) |
| Android | `GrabixPro-armeabi-v7a.apk` | Older / 32-bit devices |
| Windows | `GrabixPro_x64-setup.exe` | Installer (NSIS) |
| Windows | `GrabixPro_x64_en-US.msi` | Installer (MSI) |

Get them from **[grabix-pro.vercel.app](https://grabix-pro.vercel.app/)**.

The Android build is **sideloaded**, not distributed through Google Play, so Android will ask you to allow installation from an unknown source. The Windows installer is not code-signed yet, so SmartScreen may show a warning — choose *More info → Run anyway*.

---

## Features

### Android app

- **Share-sheet grabbing** — tap **Share** on a video in any app and choose Grabix Pro. The link lands in the app ready to download; no copy-paste.
- **Clipboard auto-grab** — copy a link and the app offers it the moment you open it.
- **Quality picker** — MP4 from 4K down to SD with file sizes shown up front, or audio only as MP3 (320 kbps) or M4A (AAC).
- **Default quality, or ask every time** — set 720p once and never think about it again, or choose per video.
- **Clip trimming** — drag a range slider to set start and end points and download only the part you want.
- **Playlists** — pick exactly which videos from a playlist to queue.
- **Download queue** — several downloads run at once, the rest wait their turn.
- **Durable background downloads** — run under WorkManager, survive the app being backgrounded or killed, and land straight in your gallery via MediaStore.
- **Built-in player** — play anything you have grabbed without leaving the app.
- **Library** — search, sort, retry failed downloads, cancel running ones, share or delete files.
- **Subtitles** — optional; de-duplicated to a single English track and embedded in the file.
- **Self-updating engine** — update yt-dlp from inside the app, so extractor fixes arrive without a new APK.

### Windows desktop app

- **Guided flow** — URL → format → destination → download, with a live activity log.
- **Quick Grab** — one click from link to finished file once a default quality and save folder are set.
- **Clip trimming**, **playlist selection**, and a **concurrent download queue** (1–5 at a time).
- **Sign in via browser cookies** — reuse your Chrome/Edge/Firefox/Brave session to fetch age-restricted, private or members-only videos.
- **Speed limit** — cap bandwidth so downloads do not saturate your connection.
- **History** — search, sort, retry, cancel, and open a file's folder.
- **System tray** — closing the window keeps downloads running; the tray shows live progress.
- **Light and dark themes.**
- **In-app engine updater.**

### Browser extension

Ships with the desktop app (Chrome, Edge, Firefox). Adds a **Download** button directly on supported video pages and hands the job to the desktop app over native messaging — no copy-paste, no extra tab. Install it by loading the bundled `extension` folder as an unpacked extension; there is a step-by-step guide on the website.

---

## How it works

Grabix Pro is a front end around **yt-dlp** (the extraction engine) and **FFmpeg** (merging, remuxing, audio extraction). Everything runs on your own device.

**Android** — an `ACTION_SEND` intent-filter puts the app in the system Share sheet. `MainActivity` pulls the URL out of the shared text and hands it to the JavaScript layer. yt-dlp runs on-device through the `youtubedl-android` wrapper, which bundles yt-dlp, Python and FFmpeg per ABI. Each download executes in a `CoroutineWorker` under WorkManager as a foreground service, and the finished file is published to the gallery through MediaStore.

```
JS / TS (React Native)                Native Android (Kotlin)
──────────────────────                ────────────────────────
App.tsx (tab shell)
 ├─ screens/HomeScreen    ──getInfo──▶  ytdl/YtdlModule        (GrabixYtdl)
 ├─ screens/LibraryScreen ──list─────▶  download/DownloadModule (GrabixDownloader)
 ├─ screens/SettingsScreen ─update───▶      └─ WorkManager
 └─ downloads.tsx (queue)                      └─ download/DownloadWorker
                                                   ├─ YoutubeDL.execute (yt-dlp + FFmpeg)
                                                   └─ download/MediaStoreSaver (gallery)

 native/ (typed bridge)  ◀── events ──  bridge/GrabixEvents  (native → JS)
                                        bridge/PrefKeys      (preferences)
                                        MainActivity         (Share intent → URL)
```

**Windows** — a Tauri app: React front end, Rust back end. The Rust layer spawns yt-dlp and FFmpeg as sidecar processes, reads their machine-readable progress output, and streams events to the UI. A native-messaging host connects the browser extension to the running app.

---

## Repository layout

This repository holds the **Android app** and the **website**. The Windows desktop client and the browser extension are maintained separately.

```
├── src/                  Android app — React Native / TypeScript
│   ├── screens/          Grab, Library, Settings, playlist picker
│   ├── components/       Player, range slider, snackbar, …
│   ├── native/           Typed bridge to the Kotlin modules
│   └── downloads.tsx     Download queue + progress state
├── android/              Kotlin: yt-dlp bridge, WorkManager, MediaStore
│   └── app/src/main/java/com/grabixpromobileapp/
│       ├── download/     DownloadWorker, DownloadModule, MediaStoreSaver
│       ├── ytdl/         Engine init, media info, playlists, updates
│       └── bridge/       Event bus, preferences, package registration
├── landing/              Website — Vite + React + Tailwind CSS
└── android-icon-new/     App icon assets
```

---

## Building from source

**Requirements:** Node.js 20+, JDK 17, Android SDK (compileSdk 36) and the Android NDK.

The app targets **minSdk 24 (Android 7.0)** and builds a **separate APK per ABI** (`arm64-v8a`, `armeabi-v7a`). This matters: the bundled Python and FFmpeg binaries are large, and a universal APK would roughly double the download size.

```bash
# Android app
npm install
cd android && ./gradlew assembleRelease
# APKs land in android/app/build/outputs/apk/release/

# Website
cd landing
npm install
npm run dev      # local preview
npm run build    # production build → landing/dist/
```

---

## Privacy

- No account, no sign-in, no tracking, no analytics, no telemetry, no ads.
- Nothing you download, paste or search is sent anywhere.
- Network traffic goes only to (1) the video platform you are downloading from and (2) GitHub, when *you* trigger an engine update.
- The optional "browser cookies" feature on Windows reads your local browser session so private videos can be fetched. Those cookies are handed to yt-dlp on your own machine and are never transmitted anywhere else.

---

## Third-party components, terms and conditions

Grabix Pro is a front end that depends on the independent open-source projects below. Each remains the property of its authors and is governed by **its own licence and terms** — please read them. Some are copyleft and impose obligations on redistribution.

| Component | Purpose | Licence / Terms |
| --- | --- | --- |
| [**yt-dlp**](https://github.com/yt-dlp/yt-dlp) | Media extraction engine | [The Unlicense](https://github.com/yt-dlp/yt-dlp/blob/master/LICENSE) (public domain) |
| [**FFmpeg**](https://ffmpeg.org/) | Merging, remuxing, audio extraction, clip cutting | [LGPL-2.1-or-later / GPL-2.0-or-later](https://ffmpeg.org/legal.html), depending on build configuration |
| [**youtubedl-android**](https://github.com/JunkFood02/youtubedl-android) | Runs yt-dlp + Python + FFmpeg on Android | [**GPL-3.0**](https://www.gnu.org/licenses/gpl-3.0.en.html) |
| [**React Native**](https://reactnative.dev/) | Android app framework | [MIT](https://github.com/facebook/react-native/blob/main/LICENSE) |
| [**React**](https://react.dev/) | UI library | [MIT](https://github.com/facebook/react/blob/main/LICENSE) |
| [**Tauri**](https://tauri.app/) | Windows desktop shell | [MIT / Apache-2.0](https://github.com/tauri-apps/tauri/blob/dev/LICENSE_MIT) |
| [**AndroidX WorkManager**](https://developer.android.com/jetpack/androidx/releases/work) | Durable background downloads | [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) |
| [**react-native-video**](https://github.com/TheWidlarzGroup/react-native-video) | In-app player (ExoPlayer) | [MIT](https://github.com/TheWidlarzGroup/react-native-video/blob/master/LICENSE) |
| [**react-native-svg**](https://github.com/software-mansion/react-native-svg) | Vector rendering | [MIT](https://github.com/software-mansion/react-native-svg/blob/main/LICENSE) |
| [**Lucide**](https://lucide.dev/) | Icon set | [ISC](https://github.com/lucide-icons/lucide/blob/main/LICENSE) |
| [**Vite**](https://vitejs.dev/) | Website build tool | [MIT](https://github.com/vitejs/vite/blob/main/LICENSE) |
| [**Tailwind CSS**](https://tailwindcss.com/) | Website styling | [MIT](https://github.com/tailwindlabs/tailwindcss/blob/master/LICENSE) |
| [**TypeScript**](https://www.typescriptlang.org/) | Language and tooling | [Apache-2.0](https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt) |

Grabix Pro is **not affiliated with, endorsed by, or sponsored by** yt-dlp, FFmpeg, Google, YouTube, Meta, TikTok, X, Vimeo, Twitch, Dailymotion, Bilibili, or any other platform or trademark holder named here. All trademarks belong to their respective owners.

### Engine updates

The in-app updater fetches yt-dlp releases directly from the official [yt-dlp GitHub repository](https://github.com/yt-dlp/yt-dlp/releases). Those builds are supplied by the yt-dlp project under its own terms; Grabix Pro does not modify them.

---

## Legal notice — please read

Grabix Pro is a general-purpose tool. **You are responsible for how you use it.**

- Download only content you **own**, content **licensed to you**, content in the **public domain**, or content you otherwise have **explicit permission** to save.
- Downloading copyrighted material without permission may be **unlawful in your jurisdiction**, and may breach the **terms of service** of the platform you download from. YouTube, Facebook, Instagram, TikTok and others generally prohibit downloading without their express permission.
- Re-uploading, redistributing or monetising other people's content without a licence is copyright infringement.
- Grabix Pro does not host, store, index, stream or distribute any media, and it does not circumvent DRM. It automates the same requests a browser makes, on your device, at your request.
- The author accepts **no liability** for misuse, for any loss or damage arising from use of this software, or for any breach of a third party's terms by an end user.

This software is provided **"as is", without warranty of any kind**, express or implied.

Rights holders with a concern about this project are welcome to get in touch using the contact details below.

---

## Licence

The Android app links against **youtubedl-android**, which is licensed under the **GNU General Public License v3.0**. The Android application is therefore distributed under the **[GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.en.html)**, and its source is published here in accordance with that licence.

---

## Contact

Questions, bug reports and feature requests are welcome.

- **Email:** [engr.syedzain@gmail.com](mailto:engr.syedzain@gmail.com)
- **WhatsApp:** [+92 300 2652848](https://wa.me/923002652848)

Built by **ZAIN**.
