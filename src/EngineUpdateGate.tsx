import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Modal, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Check, RefreshCw, TriangleAlert} from 'lucide-react-native';
import {Ytdl} from './native';
import {colors} from './theme';
import {Button} from './ui';

type Phase = 'idle' | 'updating' | 'done' | 'failed';

/**
 * Checks for a newer yt-dlp on every launch, and locks the app behind a status
 * screen while it installs one.
 *
 * The engine breaks whenever a site changes its player, so an out-of-date copy
 * is the single most common reason a download fails - and it fails late, after
 * the user has picked a video and a format. Blocking for a few seconds at launch
 * trades a visible wait for an invisible failure.
 *
 * Nothing is shown when the engine is already current, which is the usual case:
 * the check is one small JSON request (see YtdlModule.checkForUpdate), not the
 * update itself. First launch is skipped entirely - [FirstRunSetup] already
 * fetches the engine there, and two setup screens at once helps nobody.
 */
export default function EngineUpdateGate() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [target, setTarget] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (await Ytdl.isFirstRun().catch(() => false)) return;

    // Someone upgrading from a build that still carried FFmpeg in the APK has
    // never run first-run setup, so the libraries are simply absent. Fetch them
    // before anything else - without them nothing merges.
    if (!(await Ytdl.isFfmpegInstalled().catch(() => true))) {
      setTarget(null);
      setPhase('updating');
      try {
        await Ytdl.ensureFfmpeg();
      } catch {
        setPhase('failed');
        return;
      }
      setPhase('idle');
    }

    const check = await Ytdl.checkForUpdate().catch(() => null);
    if (!check?.updateAvailable) return;

    setTarget(check.latest);
    setPhase('updating');
    try {
      const res = await Ytdl.update('STABLE');
      setTarget(res.version ?? check.latest);
      setPhase('done');
      // Long enough to read, short enough not to be a second tap to dismiss.
      setTimeout(() => setPhase('idle'), 1200);
    } catch {
      setPhase('failed');
    }
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  if (phase === 'idle') return null;

  const failed = phase === 'failed';

  return (
    <Modal visible transparent={false} animationType="fade" statusBarTranslucent>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.icon}>
          {failed ? (
            <TriangleAlert size={28} color={colors.warning} />
          ) : phase === 'done' ? (
            <Check size={28} color={colors.success} strokeWidth={3} />
          ) : (
            <RefreshCw size={28} color={colors.primary} strokeWidth={2.4} />
          )}
        </View>

        <Text style={styles.title}>
          {failed
            ? "Couldn't update the engine"
            : phase === 'done'
            ? 'Download engine updated'
            : 'Updating the download engine'}
        </Text>

        <Text style={styles.sub}>
          {failed
            ? 'Grabix Pro will keep working on the version you have. Retry from Settings when you are back online.'
            : phase === 'done'
            ? target
              ? `Now on yt-dlp ${target}.`
              : 'You are on the latest yt-dlp.'
            : target
            ? `Fetching yt-dlp ${target}. This keeps downloads working when sites change their players.`
            : 'Fetching the latest yt-dlp.'}
        </Text>

        {phase === 'updating' && (
          <View style={styles.spinner}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.wait}>Please wait...</Text>
          </View>
        )}

        {failed && (
          <View style={styles.footer}>
            <Button title="Continue anyway" onPress={() => setPhase('idle')} />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 26,
    paddingTop: 90,
    paddingBottom: 20,
  },
  icon: {
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
    fontSize: 24,
    fontWeight: '800',
    marginTop: 22,
    letterSpacing: -0.3,
  },
  sub: {color: colors.textDim, fontSize: 14, marginTop: 8, lineHeight: 20},
  spinner: {marginTop: 44, alignItems: 'center', gap: 14},
  wait: {color: colors.textFaint, fontSize: 13},
  footer: {marginTop: 'auto'},
});
