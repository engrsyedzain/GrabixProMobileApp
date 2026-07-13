import React, {useState} from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Video from 'react-native-video';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ExternalLink, TriangleAlert, X} from 'lucide-react-native';
import {Downloader} from '../native';
import {colors} from '../theme';

/**
 * Full-screen in-app player for a saved file (content:// URI). Uses ExoPlayer via
 * react-native-video with native controls. An "open externally" fallback covers
 * codecs ExoPlayer can't handle.
 */
export default function PlayerModal({
  uri,
  title,
  onClose,
}: {
  uri: string | null;
  title: string;
  onClose: () => void;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <Modal
      visible={!!uri}
      transparent={false}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Pressable
            onPress={() => uri && Downloader.open(uri)}
            hitSlop={8}
            accessibilityLabel="Open externally"
            style={({pressed}) => [styles.iconBtn, pressed && {opacity: 0.6}]}>
            <ExternalLink size={20} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityLabel="Close"
            style={({pressed}) => [styles.iconBtn, pressed && {opacity: 0.6}]}>
            <X size={22} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.stage}>
          {uri && !failed ? (
            <Video
              source={{uri}}
              style={styles.video}
              controls
              resizeMode="contain"
              onError={() => setFailed(true)}
            />
          ) : (
            <View style={styles.errorBox}>
              <TriangleAlert size={40} color={colors.warning} />
              <Text style={styles.errorTitle}>Can't play this here</Text>
              <Text style={styles.errorBody}>
                This file's format isn't supported by the built-in player.
              </Text>
              <Pressable
                onPress={() => uri && Downloader.open(uri)}
                style={({pressed}) => [styles.openExt, pressed && {opacity: 0.85}]}>
                <ExternalLink size={18} color={colors.onPrimary} />
                <Text style={styles.openExtText}>Open in another app</Text>
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#000'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  title: {flex: 1, color: colors.text, fontSize: 15, fontWeight: '700'},
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  stage: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  video: {width: '100%', height: '100%'},
  errorBox: {alignItems: 'center', paddingHorizontal: 32, gap: 6},
  errorTitle: {color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 10},
  errorBody: {color: colors.textDim, fontSize: 13, textAlign: 'center', lineHeight: 19},
  openExt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  openExtText: {color: colors.onPrimary, fontWeight: '800', fontSize: 14},
});
