# Grabix Pro

Offline, Android-only React Native (CLI, **not** Expo) video grabber for YouTube,
Facebook, and hundreds of other sites. Users **Share** a video to Grabix Pro (or
paste a link); it parses the URL on-device with **yt-dlp** (via the
`youtubedl-android` wrapper), shows the available formats + file sizes, and
downloads + merges the chosen one to an MP4 in the gallery.

- No backend, no analytics, no telemetry. Network traffic goes only to the video
  platform's CDN (to fetch what you pick) and GitHub (to self-update yt-dlp).
- APK is meant to be **sideloaded**, not published to Play Store.

## Design (v2 — share-sheet + yt-dlp)

This replaced an earlier v1 that used an AccessibilityService + a floating
overlay to detect YouTube/Facebook and a NewPipeExtractor + MediaMuxer pipeline.
That approach had layout bugs when apps opened and couldn't extract Facebook.
v2 is simpler and far more stable:

1. **Deep link via the Share sheet.** An `ACTION_SEND` (text/plain) intent-filter
   makes Grabix Pro appear in YouTube/Facebook's native Share menu. Sharing a
   video sends its URL; `MainActivity` pulls the link out and hands it to JS.
2. **yt-dlp on device.** `youtubedl-android` bundles yt-dlp + Python 3.8 + ffmpeg.
   `getInfo(url)` returns the format list; `execute()` downloads and (for adaptive
   formats) merges with the bundled ffmpeg.
3. **In-app yt-dlp updates.** `updateYoutubeDL()` pulls the latest yt-dlp at
   runtime, so broken extractors are fixed without reinstalling the app.

```
JS / TS (React Native)                     Native Android (Kotlin)
──────────────────────                     ────────────────────────
App.tsx (tab shell)
 ├─ screens/HomeScreen   ──getInfo──▶      ytdl/YtdlModule      (GrabixYtdl)
 │                       ──download─▶      download/DownloadModule (GrabixDownloader)
 ├─ screens/LibraryScreen ─list────▶         └─ download/DownloadService (foreground)
 └─ screens/SettingsScreen ─update─▶              ├─ YoutubeDL.execute (yt-dlp + ffmpeg)
                                                  └─ download/MediaStoreSaver (gallery)
 native/ (typed bridge + events)           ytdl/Ytdl            (one-time init)
                                           MainActivity         (Share-intent → URL)
                                           bridge/GrabixEvents   (native→JS events)
                                           bridge/GrabixPackage  (ReactPackage)
```

### Native modules (JS names)

| JS name             | Kotlin           | Responsibility                                           |
| ------------------- | ---------------- | -------------------------------------------------------- |
| `GrabixYtdl`        | `YtdlModule`     | `getInfo(url)`, `update(channel)`, `getVersion()`, `getSharedUrl()` |
| `GrabixDownloader`  | `DownloadModule` | `download()`, `cancel()`, `listDownloads()`              |

Events via `RCTDeviceEventEmitter`: `GrabixShareReceived`,
`GrabixDownloadProgress` / `Complete` / `Error`. See [src/native/index.ts](src/native/index.ts).

## Build & run

```bash
npm install
npm start                 # Metro
npm run android           # build + install debug APK

# or just the APK:
cd android && ./gradlew :app:assembleDebug
```

- RN 0.86 (New Architecture on), min SDK 24, compile SDK 36, Kotlin 2.1.20.
- `youtubedl-android` 0.18.1 (`library` + `ffmpeg`) from Maven Central.
- **Critical build config** (in `android/app/build.gradle` + manifest):
  - `android:extractNativeLibs="true"` + `packaging { jniLibs { useLegacyPackaging = true } }`
    — the library *executes* its bundled Python/ffmpeg `.so` files, so they must
    be extracted uncompressed.
  - **ABI splits** (`android { splits { abi { … } } }`) produce one APK per
    architecture instead of a fat universal APK. Each split gets a distinct
    `versionCode` (armeabi-v7a = 100x, arm64-v8a = 200x) via an
    `applicationVariants` override. `reactNativeArchitectures` is narrowed to the
    same two ABIs so RN doesn't compile x86 libs we don't ship. Re-add `x86_64`
    to both (and set `universalApk true`) if you need an emulator/fallback build.
- **APK size** — `./gradlew assembleRelease` emits per-ABI APKs under
  `app/build/outputs/apk/release/`:

  | APK | Size | vs 214 MB universal |
  | --- | ---- | ------------------- |
  | `app-arm64-v8a-release.apk`   | **~62 MB** | −71% |
  | `app-armeabi-v7a-release.apk` | **~55 MB** | −74% |

  Ship `arm64-v8a` to virtually all modern phones; keep `armeabi-v7a` for older
  32-bit devices.
- **First launch** unpacks Python to the app's files dir (a few seconds). Grabix
  warms this up in a background thread from `MainApplication.onCreate`.

## Using it

1. In YouTube/Facebook, tap **Share ▸ Grabix Pro**. (Or paste a link on the Grab
   tab.) Grabix opens, parses the URL, and lists formats with sizes.
2. Tap a format. Video-only formats get audio merged automatically (ffmpeg).
3. The file lands in **Movies/GrabixPro** and appears on the Library tab.
4. If an extractor breaks, go to **Settings ▸ Update yt-dlp**.

## Storage model

The native yt-dlp process can only write to app-specific dirs on Android 11+
(scoped storage), so downloads go to `getExternalFilesDir()/grabix/<job>/` first,
then `MediaStoreSaver` publishes the finished MP4 into the shared
**Movies/GrabixPro** collection (no storage permission needed on Android 10+).

## Notes & limitations

- **yt-dlp is the single point of fragility** — but it's updatable in-app, which
  is the whole point of the design. Keep it updated when extraction breaks.
- Facebook: only **public** videos (yt-dlp can't see login-gated content without
  cookies). YouTube support is the most robust.
- Signed CDN URLs expire, but downloads run immediately so that's a non-issue.
