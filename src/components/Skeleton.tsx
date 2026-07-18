import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, View, ViewStyle} from 'react-native';
import {colors} from '../theme';

/** A single shimmering placeholder block (opacity pulse). */
export function SkeletonBlock({style}: {style?: ViewStyle}) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[styles.block, {opacity}, style]} />;
}

/** Placeholder for the video info card, shown while a link is being analysed. */
export default function VideoCardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBlock style={styles.thumb} />
      <View style={{padding: 16}}>
        <SkeletonBlock style={styles.lineWide} />
        <SkeletonBlock style={styles.lineNarrow} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  block: {backgroundColor: colors.surfaceAlt, borderRadius: 8},
  thumb: {width: '100%', height: 190, borderRadius: 0},
  lineWide: {width: '80%', height: 16, marginBottom: 10},
  lineNarrow: {width: '45%', height: 12},
});
