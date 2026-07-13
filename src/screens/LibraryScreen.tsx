import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Music,
  Play,
  RotateCw,
  Search,
  Share2,
  Trash2,
  Video,
  X,
} from 'lucide-react-native';
import {Downloader} from '../native';
import type {LibraryItem} from '../native/types';
import {useDownloads, ActiveJob, FailedJob} from '../downloads';
import {colors, formatBytes, formatDuration} from '../theme';
import {Card, Ring} from '../ui';
import PlayerModal from '../components/PlayerModal';

type Sort = 'newest' | 'name' | 'size';
const SORTS: {value: Sort; label: string}[] = [
  {value: 'newest', label: 'Newest'},
  {value: 'name', label: 'Name'},
  {value: 'size', label: 'Size'},
];

export default function LibraryScreen() {
  const {active, failed, completedTick, cancel, retry, dismissFailed} =
    useDownloads();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [player, setPlayer] = useState<{uri: string; title: string} | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await Downloader.listDownloads());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload on mount and whenever a download finishes.
  useEffect(() => {
    load();
  }, [load, completedTick]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? items.filter(i => i.name.toLowerCase().includes(q))
      : items;
    const sorted = [...filtered];
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'size') sorted.sort((a, b) => b.size - a.size);
    else sorted.sort((a, b) => b.dateAdded - a.dateAdded);
    return sorted;
  }, [items, query, sort]);

  const confirmCancel = useCallback(
    (id: string, title: string) => {
      Alert.alert('Cancel this download?', title, [
        {text: 'Keep downloading', style: 'cancel'},
        {
          text: 'Cancel download',
          style: 'destructive',
          onPress: () => cancel(id),
        },
      ]);
    },
    [cancel],
  );

  const confirmDelete = useCallback(
    (item: LibraryItem) => {
      Alert.alert('Delete file?', item.name, [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ok = await Downloader.remove(item.uri).catch(() => false);
            if (ok) {
              setItems(prev => prev.filter(i => i.id !== item.id));
            } else {
              Alert.alert("Couldn't delete", 'The file may have been removed already.');
            }
          },
        },
      ]);
    },
    [],
  );

  const header = (
    <View>
      {active.map(job => (
        <ActiveTile
          key={job.id}
          job={job}
          onCancel={() => confirmCancel(job.id, job.title)}
        />
      ))}
      {failed.map(job => (
        <FailedTile
          key={job.id}
          job={job}
          onRetry={() => retry(job.id)}
          onDismiss={() => dismissFailed(job.id)}
        />
      ))}
      {items.length > 3 && (
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={16} color={colors.textFaint} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search downloads"
              placeholderTextColor={colors.textFaint}
              style={styles.searchInput}
            />
          </View>
          <View style={styles.sortChips}>
            {SORTS.map(s => {
              const on = sort === s.value;
              return (
                <Pressable
                  key={s.value}
                  onPress={() => setSort(s.value)}
                  style={[styles.sortChip, on && styles.sortChipOn]}>
                  <Text style={[styles.sortText, on && styles.sortTextOn]}>
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Library</Text>
      <Text style={styles.sub}>
        {active.length > 0
          ? `${active.length} in progress · ${items.length} saved`
          : `${items.length} saved`}
      </Text>

      <FlatList
        data={visible}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={header}
        ListEmptyComponent={
          !loading && active.length === 0 && failed.length === 0 ? (
            <Card style={{marginTop: 12}}>
              <Text style={{color: colors.textDim}}>
                {query
                  ? 'No downloads match your search.'
                  : 'No downloads yet. Share a video to Grabix Pro or paste a link on the Grab tab — saved files land in Movies / Music → GrabixPro.'}
              </Text>
            </Card>
          ) : null
        }
        renderItem={({item}) => (
          <LibraryRow
            item={item}
            onPlay={() => setPlayer({uri: item.uri, title: item.name})}
            onDelete={() => confirmDelete(item)}
          />
        )}
      />

      <PlayerModal
        uri={player?.uri ?? null}
        title={player?.title ?? ''}
        onClose={() => setPlayer(null)}
      />
    </View>
  );
}

function FailedTile({
  job,
  onRetry,
  onDismiss,
}: {
  job: FailedJob;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  return (
    <View style={styles.failedTile}>
      <View style={{flex: 1, marginRight: 10}}>
        <Text style={styles.failedTitle} numberOfLines={1}>
          {job.title}
        </Text>
        <Text style={styles.failedMsg} numberOfLines={2}>
          {job.error}
        </Text>
      </View>
      {job.request && (
        <Pressable
          onPress={onRetry}
          hitSlop={6}
          accessibilityLabel="Retry"
          style={({pressed}) => [styles.retryBtn, pressed && {opacity: 0.6}]}>
          <RotateCw size={16} color={colors.primary} strokeWidth={2.6} />
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      )}
      <Pressable
        onPress={onDismiss}
        hitSlop={6}
        accessibilityLabel="Dismiss"
        style={({pressed}) => [styles.failedClose, pressed && {opacity: 0.6}]}>
        <X size={16} color={colors.textDim} />
      </Pressable>
    </View>
  );
}

function ActiveTile({job, onCancel}: {job: ActiveJob; onCancel: () => void}) {
  const pct = Math.round(job.progress * 100);
  const stageLabel: Record<string, string> = {
    queued: 'Queued',
    preparing: 'Preparing',
    downloading: 'Downloading',
    downloading_audio: 'Downloading audio',
    merging: 'Merging',
    saving: 'Saving',
  };
  return (
    <View style={styles.activeTile}>
      <Ring progress={job.progress} size={44} label={`${pct}%`} />
      <View style={{flex: 1, marginLeft: 12}}>
        <Text style={styles.activeTitle} numberOfLines={1}>
          {job.title}
        </Text>
        <Text style={styles.activeStage}>{stageLabel[job.stage] ?? job.stage}…</Text>
        <View style={styles.miniTrack}>
          <View style={[styles.miniFill, {width: `${pct}%`}]} />
        </View>
      </View>
      <Pressable
        onPress={onCancel}
        accessibilityLabel="Cancel download"
        hitSlop={8}
        style={({pressed}) => [styles.cancelBtn, pressed && {opacity: 0.55}]}>
        <X size={18} color={colors.danger} strokeWidth={2.6} />
      </Pressable>
    </View>
  );
}

function LibraryRow({
  item,
  onPlay,
  onDelete,
}: {
  item: LibraryItem;
  onPlay: () => void;
  onDelete: () => void;
}) {
  const isAudio = item.kind === 'audio';
  const ext = (item.name.split('.').pop() ?? '').toUpperCase();
  return (
    <Card style={styles.row}>
      <Thumb uri={item.uri} isAudio={isAudio} ext={ext} />
      <View style={styles.rowMid}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.meta}>
          {formatBytes(item.size)}
          {item.durationMs > 0 ? ` · ${formatDuration(item.durationMs / 1000)}` : ''}
        </Text>
      </View>
      <View style={styles.actions}>
        <ActionButton
          label="Play"
          onPress={onPlay}
          icon={<Play size={18} color={colors.primary} fill={colors.primary} />}
        />
        <ActionButton
          label="Share"
          onPress={() => Downloader.share(item.uri)}
          icon={<Share2 size={18} color={colors.text} />}
        />
        <ActionButton
          label="Delete"
          onPress={onDelete}
          danger
          icon={<Trash2 size={18} color={colors.danger} />}
        />
      </View>
    </Card>
  );
}

function Thumb({
  uri,
  isAudio,
  ext,
}: {
  uri: string;
  isAudio: boolean;
  ext: string;
}) {
  const [thumb, setThumb] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    Downloader.getThumbnail(uri)
      .then(p => alive && setThumb(p))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [uri]);

  return (
    <View style={styles.thumbWrap}>
      {thumb ? (
        <Image source={{uri: thumb}} style={styles.thumbImg} />
      ) : (
        <View
          style={[styles.thumbPh, isAudio ? styles.thumbAudio : styles.thumbVideo]}>
          {isAudio ? (
            <Music size={22} color="#CFE6FF" />
          ) : (
            <Video size={22} color="#CFE6FF" />
          )}
        </View>
      )}
      {ext ? (
        <View style={styles.extBadge}>
          <Text style={styles.extText}>{ext}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={6}
      style={({pressed}) => [
        styles.actionBtn,
        danger && styles.actionBtnDanger,
        pressed && {opacity: 0.55},
      ]}>
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20},
  h1: {color: colors.text, fontSize: 26, fontWeight: '800', marginTop: 20},
  sub: {color: colors.textDim, fontSize: 13, marginTop: 4},
  list: {paddingTop: 16, paddingBottom: 40},

  activeTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryDim,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  searchRow: {marginBottom: 12},
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: {flex: 1, color: colors.text, paddingVertical: 10, fontSize: 14},
  sortChips: {flexDirection: 'row', gap: 8, marginTop: 10},
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChipOn: {backgroundColor: 'rgba(34,182,255,0.12)', borderColor: colors.primary},
  sortText: {color: colors.textDim, fontSize: 12.5, fontWeight: '700'},
  sortTextOn: {color: colors.primary},

  failedTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(251,113,133,0.4)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  failedTitle: {color: colors.text, fontSize: 13, fontWeight: '700'},
  failedMsg: {color: colors.danger, fontSize: 11, marginTop: 3, lineHeight: 15},
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.primaryDim,
  },
  retryText: {color: colors.primary, fontSize: 12.5, fontWeight: '800'},
  failedClose: {padding: 6, marginLeft: 4},

  activeTitle: {color: colors.text, fontSize: 13, fontWeight: '700'},
  activeStage: {color: colors.textDim, fontSize: 11, marginTop: 2},
  miniTrack: {
    height: 5,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 3,
    marginTop: 6,
    overflow: 'hidden',
  },
  miniFill: {height: 5, backgroundColor: colors.primary, borderRadius: 3},
  cancelBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: 'rgba(251,113,133,0.35)',
    marginLeft: 10,
  },

  row: {flexDirection: 'row', alignItems: 'center', marginBottom: 12, padding: 10},
  rowMid: {flex: 1, marginLeft: 12},
  name: {color: colors.text, fontSize: 14, fontWeight: '700', lineHeight: 18},
  meta: {color: colors.textDim, marginTop: 4, fontSize: 12},

  thumbWrap: {width: 72, height: 52, borderRadius: 10, overflow: 'hidden'},
  thumbImg: {width: 72, height: 52},
  thumbPh: {width: 72, height: 52, alignItems: 'center', justifyContent: 'center'},
  thumbVideo: {backgroundColor: '#12314D'},
  thumbAudio: {backgroundColor: '#2A2140'},
  extBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(10,15,22,0.75)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  extText: {color: '#CFE6FF', fontSize: 8, fontWeight: '800'},

  actions: {flexDirection: 'row', alignItems: 'center', marginLeft: 4},
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: 6,
  },
  actionBtnDanger: {borderColor: 'rgba(251,113,133,0.35)'},
});
