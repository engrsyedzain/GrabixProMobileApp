import React, {useMemo, useState} from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {
  ChevronLeft,
  CircleCheck,
  Circle,
  Download,
  ListVideo,
} from 'lucide-react-native';
import type {DefaultQuality, PlaylistEntry, PlaylistInfo} from '../native/types';
import {colors, formatDuration} from '../theme';
import {Button} from '../ui';

const QUALITIES: {value: string; label: string}[] = [
  {value: '1080', label: '1080p'},
  {value: '720', label: '720p'},
  {value: '480', label: '480p'},
  {value: 'mp3', label: 'MP3'},
];

function selectorFor(q: string): string {
  return q === 'mp3' ? 'mp3' : `bestvideo[height<=${q}]+bestaudio/best`;
}

function initialQuality(d: DefaultQuality): string {
  if (QUALITIES.some(q => q.value === d)) return d;
  if (d === '2160' || d === '1440') return '1080';
  return '1080';
}

export default function PlaylistPicker({
  playlist,
  defaultQuality,
  onGrab,
  onBack,
}: {
  playlist: PlaylistInfo;
  defaultQuality: DefaultQuality;
  onGrab: (entries: PlaylistEntry[], selectorId: string) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(playlist.entries.map(e => e.id)),
  );
  const [quality, setQuality] = useState<string>(() =>
    initialQuality(defaultQuality),
  );

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected = selected.size === playlist.entries.length;
  const selectedEntries = useMemo(
    () => playlist.entries.filter(e => selected.has(e.id)),
    [playlist.entries, selected],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.back}>
          <ChevronLeft size={22} color={colors.text} />
        </Pressable>
        <View style={{flex: 1}}>
          <Text style={styles.title} numberOfLines={1}>
            {playlist.title}
          </Text>
          <Text style={styles.sub}>
            {playlist.count} videos · {selected.size} selected
          </Text>
        </View>
        <View style={styles.plIcon}>
          <ListVideo size={20} color={colors.primary} />
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={() =>
            setSelected(
              allSelected ? new Set() : new Set(playlist.entries.map(e => e.id)),
            )
          }
          style={styles.selectAll}>
          <Text style={styles.selectAllText}>
            {allSelected ? 'Clear all' : 'Select all'}
          </Text>
        </Pressable>
        <View style={styles.qChips}>
          {QUALITIES.map(q => {
            const on = quality === q.value;
            return (
              <Pressable
                key={q.value}
                onPress={() => setQuality(q.value)}
                style={[styles.qChip, on && styles.qChipOn]}>
                <Text style={[styles.qText, on && styles.qTextOn]}>{q.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={playlist.entries}
        keyExtractor={e => e.id}
        contentContainerStyle={styles.list}
        renderItem={({item, index}) => {
          const on = selected.has(item.id);
          return (
            <Pressable
              onPress={() => toggle(item.id)}
              style={({pressed}) => [styles.row, pressed && {opacity: 0.7}]}>
              {on ? (
                <CircleCheck size={22} color={colors.primary} />
              ) : (
                <Circle size={22} color={colors.textFaint} />
              )}
              <Text style={styles.index}>{index + 1}</Text>
              <View style={{flex: 1}}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.durationSeconds > 0 && (
                  <Text style={styles.rowDur}>
                    {formatDuration(item.durationSeconds)}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        }}
      />

      <View style={styles.footer}>
        <Button
          title={
            selected.size > 0
              ? `Download ${selected.size} ${selected.size === 1 ? 'video' : 'videos'}`
              : 'Select videos to download'
          }
          disabled={selected.size === 0}
          onPress={() => onGrab(selectedEntries, selectorFor(quality))}
          icon={<Download size={18} color={colors.onPrimary} strokeWidth={2.6} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  back: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  title: {color: colors.text, fontSize: 18, fontWeight: '800'},
  sub: {color: colors.textDim, fontSize: 12.5, marginTop: 2},
  plIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {paddingHorizontal: 20, paddingBottom: 10},
  selectAll: {alignSelf: 'flex-start', paddingVertical: 4},
  selectAllText: {color: colors.primary, fontSize: 13, fontWeight: '800'},
  qChips: {flexDirection: 'row', gap: 8, marginTop: 10},
  qChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qChipOn: {backgroundColor: 'rgba(34,182,255,0.12)', borderColor: colors.primary},
  qText: {color: colors.textDim, fontSize: 13, fontWeight: '700'},
  qTextOn: {color: colors.primary},
  list: {paddingHorizontal: 20, paddingBottom: 20},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  index: {color: colors.textFaint, fontSize: 12, fontWeight: '700', width: 20},
  rowTitle: {color: colors.text, fontSize: 14, fontWeight: '600', lineHeight: 19},
  rowDur: {color: colors.textDim, fontSize: 11, marginTop: 3},
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
