import type {VideoInfo, VideoFormat} from './types';

/**
 * Curated format options — ported from the desktop app's FormatStep.
 *
 * Instead of dumping raw yt-dlp formats, we present a clean list:
 *   • one MP4 option per available video resolution, and
 *   • MP3 / M4A audio-only options.
 * Each option's `id` is a yt-dlp selector/keyword that DownloadService knows how
 * to turn into a command (mirrors the desktop's start_download):
 *   "mp3"       → -x --audio-format mp3
 *   "aac_audio" → bestaudio[ext=m4a] --audio-format m4a
 *   "bestvideo[height<=H]+bestaudio/best" → remuxed to mp4
 */

export type FormatKind = 'video' | 'audio';

export interface FormatOption {
  id: string;
  label: string; // e.g. "1080p" / "MP3"
  tag: string; // badge, e.g. "Full HD" / "320 kbps"
  sublabel: string; // e.g. "MP4" / "Audio only"
  sizeBytes: number; // estimate; 0 when unknown
  kind: FormatKind;
}

function qualityLabel(h: number): string {
  if (h >= 2160) return '4K';
  if (h >= 1440) return '2K';
  if (h >= 1080) return 'Full HD';
  if (h >= 720) return 'HD';
  return 'SD';
}

function sizeOf(f: VideoFormat): number {
  return f.fileSize || 0;
}

export function buildFormatOptions(info: VideoInfo): FormatOption[] {
  const formats = info.formats ?? [];

  // Largest audio size per codec family (for size estimates).
  let audioMp3 = 0;
  let audioAac = 0;
  let audioOpus = 0;
  formats.forEach(f => {
    if (!f.hasAudio || f.hasVideo) return; // audio-only
    const sz = sizeOf(f);
    const ac = (f.acodec ?? '').toLowerCase();
    if (ac.includes('mp3') || f.ext === 'mp3') audioMp3 = Math.max(audioMp3, sz);
    if (ac.includes('mp4a') || ac.includes('aac') || f.ext === 'm4a') {
      audioAac = Math.max(audioAac, sz);
    }
    if (ac.includes('opus') || f.ext === 'webm') audioOpus = Math.max(audioOpus, sz);
  });
  const bestAudio = audioAac || audioOpus || audioMp3;

  // Available video heights + largest size per height.
  const videoSizes: Record<number, number> = {};
  formats.forEach(f => {
    if (!f.hasVideo || f.height <= 0) return;
    videoSizes[f.height] = Math.max(videoSizes[f.height] || 0, sizeOf(f));
  });
  const heights = Object.keys(videoSizes)
    .map(Number)
    .sort((a, b) => b - a);

  const options: FormatOption[] = [];

  heights.forEach(h => {
    options.push({
      id: `bestvideo[height<=${h}]+bestaudio/best`,
      label: `${h}p`,
      tag: qualityLabel(h),
      sublabel: 'MP4 · video + audio',
      sizeBytes: videoSizes[h] + bestAudio,
      kind: 'video',
    });
  });

  // Audio-only options (always offered, even if getInfo didn't size them).
  options.push({
    id: 'mp3',
    label: 'MP3',
    tag: '320 kbps',
    sublabel: 'Audio only · best quality',
    sizeBytes: audioMp3 || bestAudio,
    kind: 'audio',
  });
  options.push({
    id: 'aac_audio',
    label: 'M4A',
    tag: 'AAC',
    sublabel: 'Audio only · Apple / Windows',
    sizeBytes: audioAac || bestAudio,
    kind: 'audio',
  });

  return options;
}
