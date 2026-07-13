import React, {useId} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import {colors} from './theme';

/** Fills its parent with the brand gradient (parent must clip via borderRadius). */
export function GradientFill({
  from = colors.primary,
  to = colors.primary2,
}: {
  from?: string;
  to?: string;
}) {
  // useId can contain ":" which is invalid inside url(#…); strip it.
  const id = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  // A fixed viewBox + preserveAspectRatio="none" makes the rect scale to fill
  // the absolute-fill box reliably (percentage sizing on <Svg> is flaky on RN).
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      viewBox="0 0 100 100"
      preserveAspectRatio="none">
      <Defs>
        <SvgLinearGradient
          id={id}
          x1="0"
          y1="0"
          x2="100"
          y2="100"
          gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={from} />
          <Stop offset="1" stopColor={to} />
        </SvgLinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100" height="100" fill={`url(#${id})`} />
    </Svg>
  );
}

/** Circular progress ring. */
export function Ring({
  progress,
  size = 46,
  stroke = 4,
  label,
}: {
  progress: number; // 0..1
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={{width: size, height: size}}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.surfaceAlt}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.primary}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - clamped)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {label ? (
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.ringCenter}>
            <Text style={styles.ringLabel}>{label}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

/** The crystalline Grabix mark. */
export function Logo({size = 30}: {size?: number}) {
  return (
    <View
      style={[
        styles.logo,
        {width: size, height: size, borderRadius: size * 0.28},
      ]}>
      <Svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        <Path
          d="M8 3v9m0 0-3.2-3.2M8 12l3.2-3.2"
          stroke={colors.primary2}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M12 8.5 19 12l-7 3.5"
          stroke={colors.primary}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Small pill, e.g. quality tags (4K / HD). */
export function Chip({
  label,
  tone = 'default',
}: {
  label: string;
  tone?: 'default' | 'accent';
}) {
  return (
    <View style={[styles.chip, tone === 'accent' && styles.chipAccent]}>
      <Text style={[styles.chipText, tone === 'accent' && styles.chipTextAccent]}>
        {label}
      </Text>
    </View>
  );
}

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  icon,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
  icon?: React.ReactNode;
}) {
  const isDisabled = disabled || loading;
  const fg =
    variant === 'primary'
      ? colors.onPrimary
      : variant === 'ghost'
      ? colors.text
      : '#fff';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({pressed}) => [
        styles.btn,
        variant === 'ghost' && styles.btnGhost,
        variant === 'danger' && styles.btnDanger,
        variant === 'primary' && styles.btnPrimary,
        {opacity: isDisabled ? 0.5 : pressed ? 0.88 : 1},
      ]}>
      {variant === 'primary' && <GradientFill />}
      <View style={styles.btnRow}>
        {loading ? <ActivityIndicator color={fg} size="small" /> : icon}
        <Text style={[styles.btnText, {color: fg}]}>{title}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  logo: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryDim,
  },
  btn: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    overflow: 'hidden',
  },
  btnPrimary: {
    shadowColor: colors.primary,
    shadowOpacity: 0.28,
    shadowRadius: 9,
    shadowOffset: {width: 0, height: 4},
    elevation: 3,
  },
  btnGhost: {borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface},
  btnDanger: {backgroundColor: colors.danger},
  btnRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  btnText: {fontWeight: '800', fontSize: 15, letterSpacing: 0.2},
  chip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAccent: {
    backgroundColor: 'rgba(34,182,255,0.12)',
    borderColor: 'rgba(34,182,255,0.4)',
  },
  chipText: {color: colors.textDim, fontSize: 10, fontWeight: '800', letterSpacing: 0.4},
  chipTextAccent: {color: colors.primary},
  ringCenter: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  ringLabel: {color: colors.text, fontSize: 11, fontWeight: '800'},
});
