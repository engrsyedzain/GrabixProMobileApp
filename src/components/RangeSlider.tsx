import React, {useMemo, useRef, useState} from 'react';
import {
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  View,
} from 'react-native';
import {colors} from '../theme';

const THUMB = 24;

/**
 * Dual-thumb range slider (pure JS — PanResponder + Views, no native module).
 *
 * Selection is decided once, on grant, by the tap position; from there the
 * active thumb follows the gesture *delta* (gestureState.dx) rather than the
 * raw touch coordinate. This is deliberate: React Native's `locationX` on move
 * events is relative to whatever child view the finger is currently over (a
 * thumb, the fill bar, the track), so it jumps origin mid-drag and makes the
 * thumb teleport. A page-space delta is stable regardless of what's under the
 * finger. Values are clamped to [min, max] with a minimum gap between thumbs.
 */
export default function RangeSlider({
  min,
  max,
  start,
  end,
  minGap = 1,
  onChange,
}: {
  min: number;
  max: number;
  start: number;
  end: number;
  minGap?: number;
  onChange: (start: number, end: number) => void;
}) {
  const [width, setWidth] = useState(0);

  // Refs so PanResponder handlers always read the latest values/size.
  const startRef = useRef(start);
  const endRef = useRef(end);
  const widthRef = useRef(0);
  const active = useRef<'start' | 'end' | null>(null);
  // Value of the active thumb at the moment the drag began; the live value is
  // this plus the gesture delta converted to units.
  const grabValue = useRef(0);
  startRef.current = start;
  endRef.current = end;
  widthRef.current = width;

  const span = Math.max(1, max - min);
  const usable = Math.max(1, width - THUMB);
  const toX = (v: number) => ((v - min) / span) * usable;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // Keep the drag even if the finger leaves the row vertically.
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e: GestureResponderEvent) => {
          const u = Math.max(1, widthRef.current - THUMB);
          // locationX is reliable on grant: the touch target is the container.
          const x = Math.min(Math.max(e.nativeEvent.locationX - THUMB / 2, 0), u);
          const v = min + (x / u) * span;
          // Pick the nearer thumb; on a tie (e.g. both at the same spot) prefer
          // whichever lets the tap pull that side toward the finger.
          const dS = Math.abs(v - startRef.current);
          const dE = Math.abs(v - endRef.current);
          if (dS < dE || (dS === dE && v <= startRef.current)) {
            active.current = 'start';
            grabValue.current = startRef.current;
          } else {
            active.current = 'end';
            grabValue.current = endRef.current;
          }
          // Jump the chosen thumb to the tap so the first touch is responsive.
          apply(v);
        },
        onPanResponderMove: (
          _e: GestureResponderEvent,
          g: PanResponderGestureState,
        ) => {
          const u = Math.max(1, widthRef.current - THUMB);
          const deltaUnits = (g.dx / u) * span;
          apply(grabValue.current + deltaUnits);
        },
        onPanResponderRelease: () => {
          active.current = null;
        },
        onPanResponderTerminate: () => {
          active.current = null;
        },
      }),
    // Handlers only use refs + stable values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [min, span],
  );

  function apply(raw: number) {
    const v = Math.round(Math.min(Math.max(raw, min), max));
    if (active.current === 'start') {
      // Start can move within [min, end - minGap].
      onChange(
        Math.min(Math.max(v, min), endRef.current - minGap),
        endRef.current,
      );
    } else if (active.current === 'end') {
      // End can move within [start + minGap, max].
      onChange(
        startRef.current,
        Math.max(Math.min(v, max), startRef.current + minGap),
      );
    }
  }

  const startX = toX(start);
  const endX = toX(end);

  return (
    <View
      style={styles.wrap}
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
      {...responder.panHandlers}>
      <View style={styles.track} />
      <View
        style={[
          styles.fill,
          {left: startX + THUMB / 2, width: Math.max(0, endX - startX)},
        ]}
      />
      <View style={[styles.thumb, {left: startX}]} />
      <View style={[styles.thumb, {left: endX}]} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Taller hit area than the visual track so the whole row is grabbable.
  wrap: {height: 44, justifyContent: 'center'},
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.surfaceAlt,
  },
  fill: {
    position: 'absolute',
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  thumb: {
    position: 'absolute',
    top: 10,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.bg,
    // subtle lift
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
  },
});
