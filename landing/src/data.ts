// Official download links (provided).
export const WINDOWS_URL =
  'https://www.dropbox.com/scl/fo/ohjjm7cwhfajad2sodrp1/ANs8_caym4PYDP30k-S_g2U?rlkey=sdzi2ov7kpz7zsbfd42azs0br&st=l4w6ax7k&dl=0';
export const ANDROID_URL =
  'https://www.dropbox.com/scl/fo/u9dxi4kze5duvkqjd0xgh/ADA4PtY9xZpiTwq3lrLvtmI?rlkey=ysjqx8ttji4h6dqtyfit79iag&st=w4tz6en0&dl=0';

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
export const WORKFLOW: {n: string; title: string; body: string}[] = [
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

// Chrome extension side-load steps.
export const EXTENSION_STEPS: {title: string; body: string; note?: string}[] = [
  {
    title: 'Locate the extension',
    body: 'The extension files ship inside your Grabix Pro desktop installation — look for the "extension" folder in the app directory.',
    note: 'e.g. C:\\Program Files\\Grabix Pro\\extension',
  },
  {
    title: 'Enable Developer Mode',
    body: 'Open Google Chrome, go to the Extensions page, and switch on Developer mode using the toggle in the top-right corner.',
    note: 'chrome://extensions/',
  },
  {
    title: 'Load unpacked',
    body: 'Click "Load unpacked", then browse to the Grabix Pro directory and select the extension folder to install it.',
  },
  {
    title: 'It pairs automatically',
    body: 'Once installed, the extension connects to the running desktop app over native messaging. A Download button appears on supported video pages and hands each grab to Grabix Pro.',
  },
];
