import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {Bell, Check, Film, RefreshCw, TriangleAlert, Zap} from 'lucide-react-native';
import { Ytdl, onFfmpegProgress } from './native';
import { colors } from './theme';
import { Button } from './ui';

type StepState = 'pending' | 'running' | 'done' | 'failed';

/**
 * Runs once, on the very first launch:
 *   1. asks for notification permission (so download progress can be shown),
 *   2. updates the yt-dlp engine to the latest stable release, and
 *   3. fetches FFmpeg's shared libraries, which are downloaded rather than
 *      shipped so the APK stays roughly half the size.
 *
 * Both steps are best-effort — if either fails we still mark setup complete so
 * the user isn't nagged on every launch, and point them at Settings to retry.
 */
export default function FirstRunSetup() {
  const [visible, setVisible] = useState(false);
  const [notif, setNotif] = useState<StepState>('pending');
  const [update, setUpdate] = useState<StepState>('pending');
  const [media, setMedia] = useState<StepState>('pending');
  const [mediaPct, setMediaPct] = useState(0);
  const [version, setVersion] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const run = useCallback(async () => {
    // Kick the engine update off immediately (this also unpacks Python on a
    // fresh install), in parallel with the notification prompt — so it never
    // sits waiting behind the permission dialog.
    setUpdate('running');
    const updating = Ytdl.update('STABLE')
      .then(res => {
        setVersion(res.version);
        setUpdate('done');
      })
      .catch(() => setUpdate('failed'));

    // Notifications (Android 13+ requires an explicit grant).
    setNotif('running');
    try {
      if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
        const res = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        setNotif(
          res === PermissionsAndroid.RESULTS.GRANTED ? 'done' : 'failed',
        );
      } else {
        setNotif('done'); // granted at install time below API 33
      }
    } catch {
      setNotif('failed');
    }

    await updating;

    // FFmpeg's shared libraries, ~35 MB, fetched rather than shipped in the APK.
    // Sequential rather than alongside the engine update on purpose: two large
    // downloads over one phone connection finish no sooner together, and this
    // way each step's progress means something.
    setMedia('running');
    try {
      await Ytdl.ensureFfmpeg();
      setMedia('done');
    } catch {
      setMedia('failed');
    }

    await Ytdl.completeFirstRun().catch(() => {});
    setFinished(true);
  }, []);

  useEffect(() => {
    const sub = onFfmpegProgress(e => setMediaPct(Math.round(e.progress * 100)));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    // Later launches are EngineUpdateGate's job, including the case where this
    // screen couldn't finish its engine update (no network on first launch):
    // the gate sees no installed version, finds one on GitHub and installs it.
    Ytdl.isFirstRun()
      .then(first => {
        if (first) {
          setVisible(true);
          run();
        }
      })
      .catch(() => {});
  }, [run]);

  if (!visible) return null;

  return (
    <Modal
      visible
      transparent={false}
      animationType="fade"
      statusBarTranslucent
    >
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.logo}>
          <Zap size={30} color={colors.primary} strokeWidth={2.4} />
        </View>
        <Text style={styles.title}>Setting up Grabix Pro</Text>
        <Text style={styles.sub}>
          Just a moment — we're getting the download engine ready.
        </Text>

        <View style={styles.steps}>
          <Step
            state={notif}
            icon={<Bell size={20} color={colors.primary} />}
            title="Notifications"
            body="So we can show download progress."
            failBody="Not allowed. You can enable it later in Settings."
          />
          <Step
            state={media}
            icon={<Film size={20} color={colors.primary} />}
            title="Media toolkit"
            body={
              media === 'running'
                ? `Downloading FFmpeg${mediaPct ? ` - ${mediaPct}%` : ''}. One time only.`
                : media === 'done'
                ? 'FFmpeg is ready.'
                : 'FFmpeg merges video and audio into one file.'
            }
            failBody="Couldn't fetch FFmpeg. Retry from Settings when you're online."
          />
          <Step
            state={update}
            icon={<RefreshCw size={20} color={colors.primary} />}
            title="Download engine"
            body={
              update === 'running'
                ? 'Unpacking and updating yt-dlp… this can take a minute the first time.'
                : version
                ? `Up to date — ${version}`
                : 'Fetching the latest yt-dlp.'
            }
            failBody="Couldn't update right now. Retry from Settings when you're online."
          />
        </View>

        <View style={styles.footer}>
          {finished ? (
            <Button title="Start grabbing" onPress={() => setVisible(false)} />
          ) : (
            <Text style={styles.wait}>Please wait…</Text>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function Step({
  state,
  icon,
  title,
  body,
  failBody,
}: {
  state: StepState;
  icon: React.ReactNode;
  title: string;
  body: string;
  failBody: string;
}) {
  return (
    <View style={styles.step}>
      <View style={styles.stepIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepBody}>
          {state === 'failed' ? failBody : body}
        </Text>
      </View>
      <View style={styles.stepState}>
        {state === 'running' && (
          <ActivityIndicator size="small" color={colors.primary} />
        )}
        {state === 'done' && (
          <Check size={20} color={colors.success} strokeWidth={3} />
        )}
        {state === 'failed' && (
          <TriangleAlert size={20} color={colors.warning} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 26,
    paddingTop: 60,
    paddingBottom: 20,
  },
  logo: {
    width: 62,
    height: 62,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.primaryDim,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 22,
    letterSpacing: -0.3,
  },
  sub: { color: colors.textDim, fontSize: 14, marginTop: 8, lineHeight: 20 },
  steps: { marginTop: 34, gap: 12 },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
  },
  stepIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  stepTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  stepBody: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  stepState: { width: 28, alignItems: 'center', marginLeft: 8 },
  footer: { marginTop: 'auto' },
  wait: {
    color: colors.textFaint,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 14,
  },
});
