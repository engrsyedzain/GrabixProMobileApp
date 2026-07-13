import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';
import {Check, X} from 'lucide-react-native';
import {Downloader} from '../native';
import {useDownloads} from '../downloads';
import {colors} from '../theme';

/**
 * Success snackbar shown after a download lands, with the natural next step —
 * Open — one tap away. Replaces the old fire-and-forget toast.
 */
export default function Snackbar() {
  const {lastCompleted, dismissCompleted} = useDownloads();
  const slide = useRef(new Animated.Value(80)).current;

  useEffect(() => {
    if (!lastCompleted) return;
    Animated.spring(slide, {
      toValue: 0,
      useNativeDriver: true,
      friction: 9,
      tension: 70,
    }).start();

    const t = setTimeout(() => {
      Animated.timing(slide, {
        toValue: 100,
        duration: 220,
        useNativeDriver: true,
      }).start(() => dismissCompleted());
    }, 6000);

    return () => clearTimeout(t);
  }, [lastCompleted, slide, dismissCompleted]);

  if (!lastCompleted) return null;

  return (
    <Animated.View style={[styles.wrap, {transform: [{translateY: slide}]}]}>
      <View style={styles.bar}>
        <View style={styles.tick}>
          <Check size={16} color={colors.onPrimary} strokeWidth={3.2} />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.title} numberOfLines={1}>
            Saved to your device
          </Text>
          <Text style={styles.path} numberOfLines={1}>
            {lastCompleted.path}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            Downloader.open(lastCompleted.uri).catch(() => {});
            dismissCompleted();
          }}
          hitSlop={8}
          style={({pressed}) => [styles.open, pressed && {opacity: 0.6}]}>
          <Text style={styles.openText}>OPEN</Text>
        </Pressable>
        <Pressable
          onPress={dismissCompleted}
          hitSlop={8}
          accessibilityLabel="Dismiss"
          style={({pressed}) => [styles.close, pressed && {opacity: 0.6}]}>
          <X size={16} color={colors.textDim} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.primaryDim,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 10,
  },
  tick: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {color: colors.text, fontSize: 14, fontWeight: '700'},
  path: {color: colors.textDim, fontSize: 11, marginTop: 2},
  open: {paddingHorizontal: 6, paddingVertical: 4},
  openText: {color: colors.primary, fontSize: 13, fontWeight: '900', letterSpacing: 0.6},
  close: {padding: 4},
});
