import React, {useCallback, useEffect, useState} from 'react';
import {
  AppState,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  Download,
  Film,
  Music,
  Play,
  Share2,
  ClipboardPaste,
  Link2,
  Scissors,
} from 'lucide-react-native';
import {Ytdl, onShareReceived} from '../native';
import type {
  DefaultQuality,
  PlaylistEntry,
  PlaylistInfo,
  VideoInfo,
} from '../native/types';
import {buildFormatOptions, FormatOption} from '../native/formats';
import {useDownloads} from '../downloads';
import {tick} from '../haptics';
import {colors, formatBytes, formatDuration} from '../theme';
import {Button, Card, Chip, Ring} from '../ui';
import PlaylistPicker from './PlaylistPicker';
import RangeSlider from '../components/RangeSlider';
import TimeField from '../components/TimeField';
import VideoCardSkeleton from '../components/Skeleton';

export default function HomeScreen({onGoToLibrary}: {onGoToLibrary: () => void}) {
  const {active, start, cancel} = useDownloads();
  const [url, setUrl] = useState('');
  const [parsing, setParsing] = useState(false);
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [myJobId, setMyJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [defaultQuality, setDefaultQuality] = useState<DefaultQuality>('ask');
  const [playlistEnabled, setPlaylistEnabled] = useState(false);
  const [playlist, setPlaylist] = useState<PlaylistInfo | null>(null);
  const [showAllFormats, setShowAllFormats] = useState(false);
  const [clip, setClip] = useState<string | null>(null);
  const [trimOn, setTrimOn] = useState(false);
  const [trimStart, setTrimStart] = useState(0); // seconds
  const [trimEnd, setTrimEnd] = useState(0); // seconds

  // Reset the trim range whenever a new video loads.
  useEffect(() => {
    const d = info?.durationSeconds ?? 0;
    setTrimStart(0);
    setTrimEnd(d > 0 ? d : 0);
  }, [info]);

  useEffect(() => {
    Ytdl.getSettings()
      .then(s => {
        setDefaultQuality(s.defaultQuality);
        setPlaylistEnabled(s.playlist);
      })
      .catch(() => {});
  }, []);

  // Offer a one-tap grab when a video link is on the clipboard.
  const checkClipboard = useCallback(async () => {
    try {
      const t = (await Clipboard.getString())?.trim();
      setClip(t && isMediaUrl(t) ? t : null);
    } catch {
      setClip(null);
    }
  }, []);

  useEffect(() => {
    checkClipboard();
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') checkClipboard();
    });
    return () => sub.remove();
  }, [checkClipboard]);

  // Kick off a download from a freshly-fetched (not state) VideoInfo, so the
  // auto-grab path can grab immediately after parsing without waiting on a
  // re-render.
  const startDownload = useCallback(
    async (data: VideoInfo, selectorId: string, section?: string) => {
      setError(null);
      try {
        const id = await start({
          url: data.webpageUrl ?? data.url,
          formatSelector: selectorId,
          title: data.title,
          section,
        });
        setMyJobId(id);
      } catch (e: any) {
        setError(e?.message ?? 'Could not start download.');
      }
    },
    [start],
  );

  const parse = useCallback(
    async (target?: string, opts?: {autoDownload?: boolean}) => {
      const link = (target ?? url).trim();
      if (!link) return;
      setError(null);
      setInfo(null);
      setPlaylist(null);
      setShowAllFormats(false);
      setParsing(true);
      try {
        // If playlists are enabled and this looks like one, show the picker —
        // unless we're auto-grabbing, where we just take the single video.
        if (!opts?.autoDownload && playlistEnabled && looksLikePlaylist(link)) {
          const pl = await Ytdl.getPlaylist(link);
          if (pl.isPlaylist && pl.entries.length > 1) {
            setPlaylist(pl);
            return;
          }
        }
        const data = await Ytdl.getInfo(link);
        setInfo(data);
        if (opts?.autoDownload) {
          startDownload(data, autoSelector(defaultQuality));
        }
      } catch (e: any) {
        setError(e?.message ?? 'Could not read this video.');
      } finally {
        setParsing(false);
      }
    },
    [url, playlistEnabled, startDownload, defaultQuality],
  );

  // Share-sheet entry: drain a pending URL on mount + listen while running.
  useEffect(() => {
    Ytdl.getSharedUrl().then(shared => {
      if (shared) {
        setUrl(shared);
        parse(shared);
      }
    });
    const sub = onShareReceived(e => {
      if (e.url) {
        setUrl(e.url);
        parse(e.url);
      }
    });
    return () => sub.remove();
  }, [parse]);

  const myJob = myJobId ? active.find(j => j.id === myJobId) : undefined;

  useEffect(() => {
    if (myJobId && !active.some(j => j.id === myJobId)) setMyJobId(null);
  }, [active, myJobId]);

  const grab = useCallback(
    (selectorId: string) => {
      if (!info) return;
      tick();
      const section =
        trimOn && trimEnd > trimStart
          ? `*${Math.round(trimStart)}-${Math.round(trimEnd)}`
          : undefined;
      startDownload(info, selectorId, section);
    },
    [info, startDownload, trimOn, trimStart, trimEnd],
  );

  const grabPlaylist = useCallback(
    (entries: PlaylistEntry[], selectorId: string) => {
      entries.forEach(e =>
        start({url: e.url, formatSelector: selectorId, title: e.title}).catch(
          () => {},
        ),
      );
      setPlaylist(null);
      setUrl('');
      onGoToLibrary();
    },
    [start, onGoToLibrary],
  );

  const options = info ? buildFormatOptions(info) : null;
  const videoOptions = options?.filter(o => o.kind === 'video') ?? [];
  const audioOptions = options?.filter(o => o.kind === 'audio') ?? [];
  const showEmpty = !info && !parsing && !error && !myJob && !playlist;
  const quick = quickGrab(defaultQuality);
  // When a fixed default is set, offer one-tap grab unless the user expands.
  const useQuick = !!info && !!quick && !showAllFormats;

  if (playlist) {
    return (
      <PlaylistPicker
        playlist={playlist}
        defaultQuality={defaultQuality}
        onGrab={grabPlaylist}
        onBack={() => setPlaylist(null)}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.h1}>Grab a video</Text>
      <Text style={styles.sub}>
        Share a video to Grabix Pro, or paste a link below.
      </Text>

      <Card style={{marginTop: 16}}>
        <View style={styles.inputRow}>
          <Link2 size={18} color={colors.textFaint} />
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="https://…"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={styles.input}
          />
        </View>
        <View style={{height: 12}} />
        <Button
          title={parsing ? 'Analyzing…' : 'Get formats'}
          onPress={() => {
            tick();
            parse();
          }}
          loading={parsing}
          disabled={!url.trim()}
          icon={
            !parsing ? (
              <Download size={18} color={colors.onPrimary} strokeWidth={2.6} />
            ) : undefined
          }
        />
      </Card>

      {clip && clip !== url && (
        <Pressable
          onPress={() => {
            setUrl(clip);
            parse(clip);
            setClip(null);
          }}
          style={({pressed}) => [styles.clipChip, pressed && {opacity: 0.7}]}>
          <ClipboardPaste size={18} color={colors.primary} />
          <View style={{flex: 1}}>
            <Text style={styles.clipTitle}>Grab copied link</Text>
            <Text style={styles.clipUrl} numberOfLines={1}>
              {clip}
            </Text>
          </View>
          <Download size={18} color={colors.primary} />
        </Pressable>
      )}

      {error && (
        <Card style={{marginTop: 16, borderColor: colors.danger}}>
          <Text style={{color: colors.danger, fontWeight: '600'}}>{error}</Text>
        </Card>
      )}

      {parsing && !info && <VideoCardSkeleton />}

      {showEmpty && <EmptyState />}

      {info && (
        <Card style={{marginTop: 16, padding: 0, overflow: 'hidden'}}>
          {info.thumbnail ? (
            <View>
              <Image source={{uri: info.thumbnail}} style={styles.thumb} />
              <View style={styles.scrim} />
              <View style={styles.playOverlay}>
                <Play size={20} color="#fff" fill="#fff" />
              </View>
              {info.durationSeconds > 0 && (
                <View style={styles.durBadge}>
                  <Text style={styles.durText}>
                    {formatDuration(info.durationSeconds)}
                  </Text>
                </View>
              )}
            </View>
          ) : null}
          <View style={{padding: 16}}>
            <Text style={styles.title} numberOfLines={2}>
              {info.title}
            </Text>
            <Text style={styles.meta}>
              {info.uploader ?? info.extractor ?? 'Unknown source'}
            </Text>
          </View>
        </Card>
      )}

      {info && !myJob && (
        <Card style={{marginTop: 16}}>
          <View style={styles.trimHead}>
            <Scissors size={18} color={colors.primary} />
            <Text style={styles.trimTitle}>Trim clip</Text>
            <Switch
              value={trimOn}
              onValueChange={setTrimOn}
              trackColor={{true: colors.primaryDim, false: colors.border}}
              thumbColor={trimOn ? colors.primary : colors.textDim}
              style={{marginLeft: 'auto'}}
            />
          </View>
          {trimOn && (
            <View style={{marginTop: 14}}>
              {info && info.durationSeconds > 0 ? (
                <>
                  <RangeSlider
                    min={0}
                    max={info.durationSeconds}
                    start={trimStart}
                    end={trimEnd}
                    onChange={(s, e) => {
                      setTrimStart(s);
                      setTrimEnd(e);
                    }}
                  />
                  <View style={styles.trimRangeRow}>
                    <Text style={styles.trimRangeText}>
                      {formatDuration(trimStart)} → {formatDuration(trimEnd)}
                    </Text>
                    <Text style={styles.trimRangeDur}>
                      {formatDuration(Math.max(0, trimEnd - trimStart))} clip
                    </Text>
                  </View>
                  <View style={styles.trimFields}>
                    <TimeField
                      label="Start"
                      seconds={trimStart}
                      max={Math.max(0, trimEnd - 1)}
                      onCommit={v => setTrimStart(Math.min(v, trimEnd - 1))}
                    />
                    <TimeField
                      label="End"
                      seconds={trimEnd}
                      max={info.durationSeconds}
                      onCommit={v =>
                        setTrimEnd(
                          Math.min(
                            info.durationSeconds,
                            Math.max(v, trimStart + 1),
                          ),
                        )
                      }
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.trimFields}>
                    <TimeField
                      label="Start"
                      seconds={trimStart}
                      onCommit={v => setTrimStart(v)}
                    />
                    <TimeField
                      label="End"
                      seconds={trimEnd}
                      onCommit={v => setTrimEnd(v)}
                    />
                  </View>
                  <Text style={styles.trimHint}>
                    This source has no known length — enter start and end times
                    (mm:ss).
                  </Text>
                </>
              )}
            </View>
          )}
        </Card>
      )}

      {myJob ? (
        <Card style={{marginTop: 16}}>
          <View style={styles.jobTop}>
            <Ring progress={myJob.progress} label={`${Math.round(myJob.progress * 100)}%`} />
            <View style={{flex: 1, marginLeft: 14}}>
              <Text style={styles.jobTitle} numberOfLines={1}>
                {myJob.title}
              </Text>
              <Text style={styles.meta}>{stageLabel(myJob.stage)}</Text>
            </View>
          </View>
          <View style={{height: 14}} />
          <View style={styles.jobRow}>
            <View style={{flex: 1}}>
              <Button title="Cancel" variant="danger" onPress={() => cancel(myJob.id)} />
            </View>
            <View style={{width: 10}} />
            <View style={{flex: 1}}>
              <Button title="Library" variant="ghost" onPress={onGoToLibrary} />
            </View>
          </View>
        </Card>
      ) : useQuick && quick ? (
        <Card style={{marginTop: 16}}>
          <Text style={styles.quickHint}>Default quality · {quick.label}</Text>
          <View style={{height: 12}} />
          <Button
            title={`Download ${quick.label}`}
            onPress={() => grab(quick.id)}
            icon={<Download size={18} color={colors.onPrimary} strokeWidth={2.6} />}
          />
          <View style={{height: 10}} />
          <Button
            title="Choose another format"
            variant="ghost"
            onPress={() => setShowAllFormats(true)}
          />
        </Card>
      ) : options ? (
        <View style={{marginTop: 20}}>
          {videoOptions.length > 0 && (
            <FormatSection
              label="Video"
              icon={<Film size={15} color={colors.primary} />}
              options={videoOptions}
              onPick={o => grab(o.id)}
            />
          )}
          <FormatSection
            label="Audio only"
            icon={<Music size={15} color={colors.primary} />}
            options={audioOptions}
            onPick={o => grab(o.id)}
          />
          {videoOptions.length === 0 && audioOptions.length === 0 && (
            <Card>
              <Text style={{color: colors.textDim}}>
                No downloadable formats were found for this link.
              </Text>
            </Card>
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

function EmptyState() {
  return (
    <Card style={{marginTop: 20}}>
      <Text style={styles.emptyTitle}>Two ways to grab</Text>
      <View style={styles.emptyRow}>
        <View style={styles.emptyIcon}>
          <Share2 size={18} color={colors.primary} />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.emptyStep}>Share to Grabix Pro</Text>
          <Text style={styles.emptyBody}>
            In YouTube, Facebook or TikTok, tap Share and pick Grabix Pro. We read
            the link automatically.
          </Text>
        </View>
      </View>
      <View style={styles.emptyRow}>
        <View style={styles.emptyIcon}>
          <ClipboardPaste size={18} color={colors.primary} />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.emptyStep}>Paste a link</Text>
          <Text style={styles.emptyBody}>
            Copy any video URL and paste it above, then tap Get formats.
          </Text>
        </View>
      </View>
    </Card>
  );
}

const MEDIA_HOSTS = [
  'youtube.com',
  'youtu.be',
  'facebook.com',
  'fb.watch',
  'fb.me',
  'tiktok.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'vimeo.com',
  'twitch.tv',
  'dailymotion.com',
  'bilibili.com',
];

function isMediaUrl(text: string): boolean {
  const t = text.toLowerCase();
  return (
    (t.startsWith('http://') || t.startsWith('https://')) &&
    MEDIA_HOSTS.some(h => t.includes(h))
  );
}

function looksLikePlaylist(url: string): boolean {
  const t = url.toLowerCase();
  return (
    t.includes('list=') ||
    t.includes('/playlist') ||
    t.includes('/sets/') ||
    t.includes('/album/')
  );
}

/**
 * yt-dlp selector used when auto-grab downloads without asking. Honours a fixed
 * default quality if the user set one; otherwise falls back to 720p, per the
 * feature's "defaults to 720p" behaviour.
 */
function autoSelector(q: DefaultQuality): string {
  if (q !== 'ask') {
    const g = quickGrab(q);
    if (g) return g.id;
  }
  return 'bestvideo[height<=720]+bestaudio/best';
}

/** Maps a fixed default-quality setting to a yt-dlp selector + label. */
function quickGrab(q: DefaultQuality): {id: string; label: string} | null {
  if (q === 'ask') return null;
  if (q === 'mp3') return {id: 'mp3', label: 'MP3 audio'};
  const names: Record<string, string> = {
    '2160': '4K',
    '1440': '2K',
    '1080': '1080p',
    '720': '720p',
    '480': '480p',
  };
  return {
    id: `bestvideo[height<=${q}]+bestaudio/best`,
    label: `${names[q] ?? `${q}p`} MP4`,
  };
}

function stageLabel(stage: string) {
  const map: Record<string, string> = {
    queued: 'Queued — waiting…',
    preparing: 'Preparing…',
    downloading: 'Downloading…',
    downloading_audio: 'Downloading audio…',
    merging: 'Merging video + audio…',
    saving: 'Saving to your gallery…',
  };
  return map[stage] ?? `${stage}…`;
}

function FormatSection({
  label,
  icon,
  options,
  onPick,
}: {
  label: string;
  icon: React.ReactNode;
  options: FormatOption[];
  onPick: (o: FormatOption) => void;
}) {
  return (
    <View style={{marginBottom: 10}}>
      <View style={styles.sectionRow}>
        {icon}
        <Text style={styles.section}>{label}</Text>
      </View>
      {options.map(o => (
        <Pressable
          key={o.id}
          onPress={() => onPick(o)}
          style={({pressed}) => [styles.fmtRow, pressed && styles.fmtRowPressed]}>
          <View style={{flex: 1}}>
            <View style={styles.fmtTop}>
              <Text style={styles.fmtLabel}>{o.label}</Text>
              <Chip label={o.tag} tone={o.kind === 'video' ? 'accent' : 'default'} />
            </View>
            <Text style={styles.fmtNote}>{o.sublabel}</Text>
          </View>
          <Text style={styles.fmtSize}>
            {o.sizeBytes > 0 ? `~${formatBytes(o.sizeBytes)}` : '—'}
          </Text>
          <View style={styles.fmtGrabBtn}>
            <Download size={18} color={colors.onPrimary} strokeWidth={2.6} />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  content: {paddingHorizontal: 20, paddingBottom: 60},
  h1: {color: colors.text, fontSize: 27, fontWeight: '800', letterSpacing: -0.4},
  sub: {color: colors.textDim, marginTop: 6, fontSize: 14},

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {flex: 1, color: colors.text, paddingVertical: 13, fontSize: 15},

  clipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    backgroundColor: 'rgba(34,182,255,0.08)',
    borderWidth: 1,
    borderColor: colors.primaryDim,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  clipTitle: {color: colors.text, fontSize: 13, fontWeight: '700'},
  clipUrl: {color: colors.textDim, fontSize: 11, marginTop: 2},

  trimHead: {flexDirection: 'row', alignItems: 'center', gap: 9},
  trimTitle: {color: colors.text, fontSize: 15, fontWeight: '700'},
  trimRangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  trimRangeText: {color: colors.text, fontSize: 14, fontWeight: '700'},
  trimRangeDur: {color: colors.primary, fontSize: 12.5, fontWeight: '800'},
  trimFields: {flexDirection: 'row', gap: 12},
  trimHint: {color: colors.textFaint, fontSize: 11.5, marginTop: 10},

  thumb: {width: '100%', height: 190},
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,15,22,0.25)',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  durText: {color: '#fff', fontSize: 11, fontWeight: '700'},

  title: {color: colors.text, fontSize: 17, fontWeight: '700', lineHeight: 23},
  meta: {color: colors.textDim, marginTop: 5, fontSize: 13},

  quickHint: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  jobTop: {flexDirection: 'row', alignItems: 'center'},
  jobTitle: {color: colors.text, fontSize: 15, fontWeight: '700'},
  jobRow: {flexDirection: 'row'},

  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 14,
  },
  emptyRow: {flexDirection: 'row', gap: 12, marginBottom: 14},
  emptyIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStep: {color: colors.text, fontSize: 14, fontWeight: '700'},
  emptyBody: {color: colors.textDim, fontSize: 12.5, marginTop: 3, lineHeight: 18},

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
  },
  section: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  fmtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 9,
  },
  fmtRowPressed: {opacity: 0.75, borderColor: colors.primaryDim},
  fmtTop: {flexDirection: 'row', alignItems: 'center', gap: 8},
  fmtLabel: {color: colors.text, fontSize: 16, fontWeight: '800'},
  fmtNote: {color: colors.textDim, fontSize: 11.5, marginTop: 3},
  fmtSize: {color: colors.textDim, fontSize: 12.5, marginHorizontal: 10, fontWeight: '600'},
  fmtGrabBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
