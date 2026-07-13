import {DeviceEventEmitter, NativeModules, EmitterSubscription} from 'react-native';
import type {
  VideoInfo,
  DownloadRequest,
  LibraryItem,
  DownloadProgressEvent,
  DownloadCompleteEvent,
  DownloadErrorEvent,
  ShareReceivedEvent,
  UpdateChannel,
  UpdateResult,
  AppSettings,
  PlaylistInfo,
} from './types';

const {GrabixYtdl, GrabixDownloader} = NativeModules;

function assertLinked() {
  if (!GrabixYtdl || !GrabixDownloader) {
    throw new Error(
      'Grabix native modules are not linked. Rebuild the Android app (npm run android).',
    );
  }
}

// --- yt-dlp engine ----------------------------------------------------------

export const Ytdl = {
  /** Parse a URL into title + a pickable list of formats. */
  getInfo(url: string): Promise<VideoInfo> {
    assertLinked();
    return GrabixYtdl.getInfo(url);
  },
  /** Fetch a playlist's entries (flat/fast). isPlaylist=false for single videos. */
  getPlaylist(url: string): Promise<PlaylistInfo> {
    assertLinked();
    return GrabixYtdl.getPlaylist(url);
  },
  /** Download the latest yt-dlp for a channel; resolves with status + version. */
  update(channel: UpdateChannel = 'STABLE'): Promise<UpdateResult> {
    assertLinked();
    return GrabixYtdl.update(channel);
  },
  /** Current on-device yt-dlp version (null before first init/update). */
  getVersion(): Promise<string | null> {
    return GrabixYtdl.getVersion();
  },
  /** Drain a URL delivered via the Share sheet before JS mounted. */
  getSharedUrl(): Promise<string | null> {
    return GrabixYtdl.getSharedUrl();
  },
  /** True until first-run setup has completed. */
  isFirstRun(): Promise<boolean> {
    return GrabixYtdl.isFirstRun();
  },
  /** Marks first-run setup done so it never runs again. */
  completeFirstRun(): Promise<boolean> {
    return GrabixYtdl.completeFirstRun();
  },
  /** Read user preferences (playlist / subtitles / default quality). */
  getSettings(): Promise<AppSettings> {
    return GrabixYtdl.getSettings();
  },
  /** Persist a partial set of preferences. */
  setSettings(partial: Partial<AppSettings>): Promise<boolean> {
    return GrabixYtdl.setSettings(partial);
  },
};

// --- downloader -------------------------------------------------------------

export const Downloader = {
  download(request: DownloadRequest): Promise<string> {
    assertLinked();
    return GrabixDownloader.download(request);
  },
  cancel(id: string): Promise<boolean> {
    return GrabixDownloader.cancel(id);
  },
  listDownloads(): Promise<LibraryItem[]> {
    return GrabixDownloader.listDownloads();
  },
  /** Open a saved file in the default player. */
  open(uri: string): Promise<boolean> {
    return GrabixDownloader.openItem(uri);
  },
  /** Share a saved file via the system share sheet. */
  share(uri: string): Promise<boolean> {
    return GrabixDownloader.shareItem(uri);
  },
  /** Delete a saved file from the device. */
  remove(uri: string): Promise<boolean> {
    return GrabixDownloader.deleteItem(uri);
  },
  /** Cached JPEG thumbnail path for a saved item, or null. */
  getThumbnail(uri: string): Promise<string | null> {
    return GrabixDownloader.getThumbnail(uri);
  },
};

// --- events (all via RCTDeviceEventEmitter) ---------------------------------

export const GrabixEvent = {
  ShareReceived: 'GrabixShareReceived',
  DownloadProgress: 'GrabixDownloadProgress',
  DownloadComplete: 'GrabixDownloadComplete',
  DownloadError: 'GrabixDownloadError',
} as const;

export function onShareReceived(
  cb: (e: ShareReceivedEvent) => void,
): EmitterSubscription {
  return DeviceEventEmitter.addListener(GrabixEvent.ShareReceived, cb);
}
export function onDownloadProgress(
  cb: (e: DownloadProgressEvent) => void,
): EmitterSubscription {
  return DeviceEventEmitter.addListener(GrabixEvent.DownloadProgress, cb);
}
export function onDownloadComplete(
  cb: (e: DownloadCompleteEvent) => void,
): EmitterSubscription {
  return DeviceEventEmitter.addListener(GrabixEvent.DownloadComplete, cb);
}
export function onDownloadError(
  cb: (e: DownloadErrorEvent) => void,
): EmitterSubscription {
  return DeviceEventEmitter.addListener(GrabixEvent.DownloadError, cb);
}

export * from './types';
