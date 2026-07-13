import React, {useCallback, useEffect, useState} from 'react';
import {
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import {
  Bell,
  Captions,
  Check,
  Info,
  ListVideo,
  RefreshCw,
  Settings2,
  Share2,
  TriangleAlert,
} from 'lucide-react-native';
import {Ytdl} from '../native';
import type {AppSettings, DefaultQuality, UpdateChannel} from '../native/types';
import {colors} from '../theme';
import {Button, Card} from '../ui';

const QUALITY_OPTIONS: {value: DefaultQuality; label: string}[] = [
  {value: 'ask', label: 'Ask every time'},
  {value: '2160', label: '4K'},
  {value: '1440', label: '2K'},
  {value: '1080', label: '1080p'},
  {value: '720', label: '720p'},
  {value: '480', label: '480p'},
  {value: 'mp3', label: 'MP3'},
];

export default function SettingsScreen() {
  const [notifOk, setNotifOk] = useState(true);
  const [version, setVersion] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [settings, setSettingsState] = useState<AppSettings>({
    playlist: false,
    subtitles: false,
    defaultQuality: 'ask',
  });

  const refresh = useCallback(async () => {
    if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
      setNotifOk(
        await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        ),
      );
    }
    // versionName may be null until the first init/update completes.
    Ytdl.getVersion().then(setVersion).catch(() => setVersion(null));
    Ytdl.getSettings().then(setSettingsState).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const patchSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettingsState(prev => ({...prev, ...partial}));
    Ytdl.setSettings(partial).catch(() => {});
  }, []);

  const requestNotif = async () => {
    if (Number(Platform.Version) >= 33) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      refresh();
    }
  };

  const runUpdate = async (channel: UpdateChannel) => {
    setUpdating(true);
    try {
      const res = await Ytdl.update(channel);
      setVersion(res.version);
      ToastAndroid.show(
        res.status === 'ALREADY_UP_TO_DATE'
          ? `Already up to date (${res.version ?? '?'})`
          : `Updated to ${res.version ?? '?'}`,
        ToastAndroid.LONG,
      );
    } catch (e: any) {
      ToastAndroid.show(e?.message ?? 'Update failed', ToastAndroid.LONG);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{padding: 20, paddingBottom: 40}}>
      <Text style={styles.h1}>Settings</Text>

      <Text style={styles.section}>Extractor engine (yt-dlp)</Text>
      <Card>
        <SettingRow
          icon={<RefreshCw size={20} color={colors.primary} />}
          label="yt-dlp version"
          desc={version ?? 'Not initialized yet'}
          ok={!!version}
        />
        <Text style={styles.hint}>
          Update yt-dlp to fix broken extractors after YouTube/Facebook change
          things — no app reinstall needed.
        </Text>
        <View style={{height: 8}} />
        <Button
          title={updating ? 'Updating…' : 'Update yt-dlp (stable)'}
          onPress={() => runUpdate('STABLE')}
          loading={updating}
        />
        <View style={{height: 8}} />
        <Button
          title="Update to nightly"
          variant="ghost"
          disabled={updating}
          onPress={() => runUpdate('NIGHTLY')}
        />
      </Card>

      <Text style={styles.section}>Download preferences</Text>
      <Card>
        <View style={styles.qualityHead}>
          <View style={styles.iconTile}>
            <Settings2 size={20} color={colors.primary} />
          </View>
          <View style={{flex: 1, marginLeft: 14}}>
            <Text style={styles.rowLabel}>Default quality</Text>
            <Text style={styles.rowDesc}>
              {settings.defaultQuality === 'ask'
                ? 'You pick the format each time a video loads.'
                : 'One tap grabs this quality automatically.'}
            </Text>
          </View>
        </View>
        <View style={styles.chipsWrap}>
          {QUALITY_OPTIONS.map(opt => {
            const on = settings.defaultQuality === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => patchSettings({defaultQuality: opt.value})}
                style={[styles.qChip, on && styles.qChipOn]}>
                <Text style={[styles.qChipText, on && styles.qChipTextOn]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.divider} />

        <ToggleRow
          icon={<ListVideo size={20} color={colors.primary} />}
          label="Playlist picker"
          desc="On: opening a playlist link lets you pick which videos to grab. Off: grab just the one video."
          value={settings.playlist}
          onChange={v => patchSettings({playlist: v})}
        />
        <View style={styles.divider} />
        <ToggleRow
          icon={<Captions size={20} color={colors.primary} />}
          label="Download subtitles"
          desc="Fetch English subtitles/captions and embed them in the video."
          value={settings.subtitles}
          onChange={v => patchSettings({subtitles: v})}
        />
      </Card>

      <Text style={styles.section}>Permissions</Text>
      <Card>
        <SettingRow
          icon={<Bell size={20} color={colors.primary} />}
          label="Notifications"
          desc="Shows download progress."
          ok={notifOk}
        />
        {!notifOk && (
          <>
            <View style={{height: 8}} />
            <Button
              title="Enable notifications"
              variant="ghost"
              onPress={requestNotif}
            />
          </>
        )}
      </Card>

      <Text style={styles.section}>How to use</Text>
      <Card>
        <View style={styles.howRow}>
          <View style={styles.iconTile}>
            <Share2 size={20} color={colors.primary} />
          </View>
          <Text style={[styles.rowDesc, {flex: 1, marginTop: 0}]}>
            In YouTube or Facebook, tap <Text style={styles.b}>Share</Text> and
            choose <Text style={styles.b}>Grabix Pro</Text>. The app opens, reads
            the link, and shows the available formats. You can also paste a link
            directly on the Grab tab.
          </Text>
        </View>
      </Card>

      <Text style={styles.section}>About</Text>
      <Card>
        <View style={styles.row}>
          <View style={styles.iconTile}>
            <Info size={20} color={colors.primary} />
          </View>
          <View style={{flex: 1, marginLeft: 14}}>
            <Text style={styles.rowLabel}>Grabix Pro</Text>
            <Text style={styles.rowDesc}>Version 1.0.0</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.devBlock}>
          <Text style={styles.devLabel}>Developed by</Text>
          <Text style={styles.devName}>ZAIN</Text>
          <Text style={styles.devCopy}>© 2025 · All rights reserved</Text>
        </View>
      </Card>

      <Text style={styles.footer}>
        Grabix Pro is fully offline. No analytics, no telemetry — the only network
        traffic is to the video platform's CDN (to fetch what you pick) and GitHub
        (to update yt-dlp).
      </Text>
    </ScrollView>
  );
}

function ToggleRow({
  icon,
  label,
  desc,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.iconTile}>{icon}</View>
      <View style={{flex: 1, marginLeft: 14, marginRight: 10}}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{true: colors.primaryDim, false: colors.border}}
        thumbColor={value ? colors.primary : colors.textDim}
      />
    </View>
  );
}

function SettingRow({
  icon,
  label,
  desc,
  ok,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  ok: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.iconTile}>{icon}</View>
      <View style={{flex: 1, marginLeft: 14}}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      {ok ? (
        <Check size={20} color={colors.success} strokeWidth={3} />
      ) : (
        <TriangleAlert size={20} color={colors.warning} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  h1: {color: colors.text, fontSize: 26, fontWeight: '800'},
  iconTile: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 14},
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  devBlock: {alignItems: 'center', paddingBottom: 4},
  devLabel: {
    color: colors.textFaint,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  devName: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 4,
  },
  devCopy: {color: colors.textDim, fontSize: 11, marginTop: 6},
  section: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 10,
  },
  row: {flexDirection: 'row', alignItems: 'center', paddingVertical: 6},
  rowLabel: {color: colors.text, fontSize: 15, fontWeight: '600'},
  rowDesc: {color: colors.textDim, fontSize: 13, marginTop: 3, lineHeight: 18},
  hint: {color: colors.textDim, fontSize: 12, marginTop: 10, lineHeight: 16},
  qualityHead: {flexDirection: 'row', alignItems: 'center'},
  chipsWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14},
  qChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qChipOn: {
    backgroundColor: 'rgba(34,182,255,0.12)',
    borderColor: colors.primary,
  },
  qChipText: {color: colors.textDim, fontSize: 13, fontWeight: '700'},
  qChipTextOn: {color: colors.primary},
  b: {color: colors.text, fontWeight: '700'},
  footer: {color: colors.textDim, fontSize: 12, marginTop: 24, lineHeight: 18},
});
