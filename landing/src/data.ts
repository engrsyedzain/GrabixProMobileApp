// Official download links (provided).
export const WINDOWS_URL =
  'https://archive.org/download/grabix-pro-0.1.1-x-64-setup/GrabixPro_0.1.1_x64-setup.exe';
export const ANDROID_URL =
  'https://archive.org/download/grabix-pro-arm-64-v-8a/GrabixPro-arm64-v8a.apk';

// Developer contact.
export const CONTACT_EMAIL = 'engr.syedzain@gmail.com';
export const CONTACT_WHATSAPP = '+92 300 2652848';
// wa.me expects digits only — no '+', spaces or dashes.
export const WHATSAPP_URL = `https://wa.me/${CONTACT_WHATSAPP.replace(/\D/g, '')}`;
export const MAILTO_URL = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  'Grabix Pro — Support',
)}`;

// Platforms Grabix Pro supports (from the browser-extension manifest).
export const PLATFORMS = [
  'YouTube',
  'TikTok',
  'Instagram',
  'Facebook',
  'X / Twitter',
  'Vimeo',
  'Twitch',
  'Dailymotion',
  'Bilibili',
];

// The workflow: Share/paste a link → Format → Trim → Download.
export const WORKFLOW: { n: string; title: string; body: string }[] = [
  {
    n: '01',
    title: 'Share or paste a link',
    body: 'On Android, tap Share on any video and pick Grabix Pro; on desktop, paste the URL or click Download from the browser extension. Auto-paste catches links from your clipboard.',
  },
  {
    n: '02',
    title: 'Choose format & quality',
    body: 'Pick MP4 from 4K down to SD, or pull audio only as MP3 or M4A. Set a default quality, or have the app ask every time.',
  },
  {
    n: '03',
    title: 'Trim to just the part you want',
    body: 'Optionally drag the range slider to set start and end points and save only that clip — or leave it to grab the whole thing.',
  },
  {
    n: '04',
    title: 'Download & keep',
    body: 'FFmpeg merges and remuxes to a clean, fast-start MP4. It runs in the background, lands in your gallery, and plays in the built-in player.',
  },
];

export type ExtensionStep = { title: string; body: string; note?: string };

// The install folder the desktop app creates. Per-user, not Program Files: the app
// rewrites its native-messaging manifest into this folder on every launch, which a
// machine-wide install would deny to a standard user.
export const EXTENSION_DIR = '%LOCALAPPDATA%\\Programs\\Grabix Pro\\extension';

// Firefox: a Mozilla-signed .xpi ships with the installer, so it installs
// permanently from about:addons and needs no ID — the app already authorises this
// add-on by its fixed ID.
export const FIREFOX_STEPS: ExtensionStep[] = [
  {
    title: 'Open the Add-ons page',
    body: 'In Firefox, open the Add-ons page, click the gear icon near the top right, and choose "Install Add-on From File".',
    note: 'about:addons',
  },
  {
    title: 'Pick the signed add-on',
    body: 'Select grabix-pro-firefox.xpi from the extension folder inside your Grabix Pro installation, then confirm when Firefox asks.',
    note: `${EXTENSION_DIR}\\grabix-pro-firefox.xpi`,
  },
  {
    title: 'That’s it',
    body: 'The add-on is signed by Mozilla, so it stays installed and pairs with the desktop app on its own. A Download button appears on supported video pages.',
  },
];

// Chrome: loaded unpacked, and it genuinely needs the ID registered — Chrome will
// only talk to a native host that names the exact extension ID, and that ID is
// generated at load time.
export const CHROME_STEPS: ExtensionStep[] = [
  {
    title: 'Enable Developer mode',
    body: 'Open the Extensions page in Chrome, Edge or Brave, and switch on Developer mode using the toggle in the top-right corner.',
    note: 'chrome://extensions',
  },
  {
    title: 'Load unpacked',
    body: 'Click "Load unpacked", then select the extension folder inside your Grabix Pro installation.',
    note: EXTENSION_DIR,
  },
  {
    title: 'Register the host',
    body: 'Copy the Extension ID from the new extension’s card, paste it into Grabix Pro → Settings → Browser Extension, and click Register Host. Chrome only permits the connection once the app knows this ID.',
  },
  {
    title: 'Ready',
    body: 'The popup reads “Connected”, and a Download button appears on supported video pages — each grab is handed to Grabix Pro.',
  },
];
