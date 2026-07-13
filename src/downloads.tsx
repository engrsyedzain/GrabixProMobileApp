import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import {ToastAndroid} from 'react-native';
import {
  Downloader,
  onDownloadComplete,
  onDownloadError,
  onDownloadProgress,
} from './native';
import type {DownloadRequest} from './native/types';

/** How many downloads run at once; the rest wait in the queue. */
const MAX_CONCURRENT = 2;

export interface ActiveJob {
  id: string; // stable client id
  title: string;
  progress: number; // 0..1
  stage: string; // 'queued' | 'preparing' | 'downloading' | 'merging' | 'saving' | …
}

export interface CompletedJob {
  id: string;
  title: string;
  uri: string;
  path: string;
}

export interface FailedJob {
  id: string;
  title: string;
  error: string;
  request?: DownloadRequest; // present → retryable
}

interface Item {
  clientId: string;
  request: DownloadRequest;
  title: string;
  status: 'queued' | 'active';
  nativeId?: string;
  progress: number;
  stage: string;
}

interface DownloadsContextValue {
  /** Everything in flight — queued and active, in enqueue order. */
  active: ActiveJob[];
  failed: FailedJob[];
  /** Queue a download; returns its stable client id. */
  start: (req: DownloadRequest) => Promise<string>;
  cancel: (id: string) => void;
  retry: (id: string) => void;
  dismissFailed: (id: string) => void;
  completedTick: number;
  lastCompleted: CompletedJob | null;
  dismissCompleted: () => void;
}

const DownloadsContext = createContext<DownloadsContextValue | null>(null);

/**
 * Global download manager. Screens call start()/cancel(); this caps how many run
 * concurrently and pumps the queue as jobs finish, so a big playlist doesn't
 * spawn dozens of parallel yt-dlp/ffmpeg processes. Native progress events are
 * matched back to queued items by their native id.
 */
export function DownloadsProvider({children}: {children: React.ReactNode}) {
  const itemsRef = useRef<Map<string, Item>>(new Map());
  const nativeToClientRef = useRef<Record<string, string>>({});
  const counterRef = useRef(0);
  const [, forceRender] = useReducer((x: number) => x + 1, 0);

  const [failed, setFailed] = useState<FailedJob[]>([]);
  const [completedTick, setCompletedTick] = useState(0);
  const [lastCompleted, setLastCompleted] = useState<CompletedJob | null>(null);

  const sync = forceRender;

  // Start queued items up to the concurrency cap.
  const pump = useCallback(() => {
    const items = [...itemsRef.current.values()];
    let running = items.filter(i => i.status === 'active').length;
    for (const it of items) {
      if (running >= MAX_CONCURRENT) break;
      if (it.status !== 'queued') continue;
      it.status = 'active';
      it.stage = 'preparing';
      running++;
      Downloader.download(it.request)
        .then(nativeId => {
          it.nativeId = nativeId;
          nativeToClientRef.current[nativeId] = it.clientId;
          sync();
        })
        .catch(err => {
          itemsRef.current.delete(it.clientId);
          setFailed(prev => [
            {
              id: it.clientId,
              title: it.title,
              error: err?.message ?? 'Could not start',
              request: it.request,
            },
            ...prev,
          ]);
          sync();
          pump();
        });
    }
    sync();
  }, [sync]);

  useEffect(() => {
    const p = onDownloadProgress(e => {
      const cid = nativeToClientRef.current[e.id];
      const it = cid ? itemsRef.current.get(cid) : undefined;
      if (it) {
        it.progress = e.progress;
        it.stage = e.stage;
        sync();
      }
    });
    const c = onDownloadComplete(e => {
      const cid = nativeToClientRef.current[e.id];
      if (cid) {
        itemsRef.current.delete(cid);
        delete nativeToClientRef.current[e.id];
      }
      setCompletedTick(t => t + 1);
      setLastCompleted({id: e.id, title: e.title, uri: e.uri, path: e.path});
      pump();
    });
    const err = onDownloadError(e => {
      const cid = nativeToClientRef.current[e.id];
      const it = cid ? itemsRef.current.get(cid) : undefined;
      if (cid) {
        itemsRef.current.delete(cid);
        delete nativeToClientRef.current[e.id];
      }
      if (e.error !== 'Cancelled') {
        setFailed(prev => [
          {id: e.id, title: e.title, error: e.error, request: it?.request},
          ...prev.filter(f => f.id !== e.id),
        ]);
        ToastAndroid.show(`Download failed: ${e.error}`, ToastAndroid.LONG);
      }
      pump();
    });
    return () => {
      p.remove();
      c.remove();
      err.remove();
    };
  }, [pump, sync]);

  const start = useCallback(
    async (req: DownloadRequest) => {
      const clientId = `job_${Date.now()}_${counterRef.current++}`;
      itemsRef.current.set(clientId, {
        clientId,
        request: req,
        title: req.title ?? 'video',
        status: 'queued',
        progress: 0,
        stage: 'queued',
      });
      pump();
      return clientId;
    },
    [pump],
  );

  const cancel = useCallback(
    (clientId: string) => {
      const it = itemsRef.current.get(clientId);
      if (!it) return;
      if (it.nativeId) {
        Downloader.cancel(it.nativeId).catch(() => {});
        delete nativeToClientRef.current[it.nativeId];
      }
      itemsRef.current.delete(clientId);
      sync();
      pump();
    },
    [pump, sync],
  );

  const dismissFailed = useCallback((id: string) => {
    setFailed(prev => prev.filter(f => f.id !== id));
  }, []);

  const retry = useCallback(
    (id: string) => {
      const job = failed.find(f => f.id === id);
      dismissFailed(id);
      if (job?.request) start(job.request);
    },
    [failed, dismissFailed, start],
  );

  const dismissCompleted = useCallback(() => setLastCompleted(null), []);

  const active: ActiveJob[] = [...itemsRef.current.values()].map(i => ({
    id: i.clientId,
    title: i.title,
    progress: i.progress,
    stage: i.stage,
  }));

  const value: DownloadsContextValue = {
    active,
    failed,
    start,
    cancel,
    retry,
    dismissFailed,
    completedTick,
    lastCompleted,
    dismissCompleted,
  };

  return (
    <DownloadsContext.Provider value={value}>
      {children}
    </DownloadsContext.Provider>
  );
}

export function useDownloads(): DownloadsContextValue {
  const ctx = useContext(DownloadsContext);
  if (!ctx) throw new Error('useDownloads must be used within DownloadsProvider');
  return ctx;
}
