// Shapes mirror the WritableMaps produced by the Kotlin native modules
// (YtdlModule / DownloadService). Keep in sync.

export interface VideoFormat {
  formatId: string | null;
  ext: string | null;
  formatNote: string | null; // e.g. "1080p", "medium"
  vcodec: string | null; // "none" when audio-only
  acodec: string | null; // "none" when video-only
  width: number;
  height: number;
  fileSize: number; // bytes; 0 when yt-dlp doesn't report it
  fps: number;
  hasVideo: boolean;
  hasAudio: boolean;
}

export interface VideoInfo {
  url: string; // the URL we passed in
  webpageUrl: string | null; // canonical page URL from yt-dlp
  title: string;
  uploader: string | null;
  thumbnail: string | null;
  extractor: string | null; // "youtube", "facebook", …
  durationSeconds: number;
  formats: VideoFormat[];
}

export interface PlaylistEntry {
  id: string;
  title: string;
  url: string;
  durationSeconds: number;
}

export interface PlaylistInfo {
  isPlaylist: boolean;
  title: string;
  count: number;
  entries: PlaylistEntry[];
}

export interface DownloadRequest {
  id?: string;
  url: string; // video page URL
  // yt-dlp selector/keyword from buildFormatOptions: "mp3" | "aac_audio" |
  // "bestvideo[height<=H]+bestaudio/best". DownloadService maps it to a command.
  formatSelector: string;
  title?: string;
  // Optional trim, as a yt-dlp --download-sections value, e.g. "*00:30-01:45".
  section?: string;
}

export interface DownloadProgressEvent {
  id: string;
  title: string;
  progress: number; // 0..1
  stage: 'preparing' | 'downloading' | 'downloading_audio' | 'merging' | 'saving';
}

export interface DownloadCompleteEvent {
  id: string;
  title: string;
  uri: string;
  path: string;
}

export interface DownloadErrorEvent {
  id: string;
  title: string;
  error: string;
}

export interface ShareReceivedEvent {
  url: string;
}

export interface LibraryItem {
  id: string;
  uri: string;
  name: string;
  size: number;
  dateAdded: number; // epoch seconds
  durationMs: number;
  kind?: 'audio' | 'video';
}

export type DefaultQuality =
  | 'ask'
  | '2160'
  | '1440'
  | '1080'
  | '720'
  | '480'
  | 'mp3';

export interface AppSettings {
  playlist: boolean;
  subtitles: boolean;
  defaultQuality: DefaultQuality;
}

export type UpdateChannel = 'STABLE' | 'NIGHTLY' | 'MASTER';

export interface UpdateResult {
  status: string; // "DONE" | "ALREADY_UP_TO_DATE" | "UNKNOWN"
  version: string | null;
}
