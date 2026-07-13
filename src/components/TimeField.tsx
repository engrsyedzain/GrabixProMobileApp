import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import {colors, formatDuration, parseTime} from '../theme';

/**
 * Editable time field with strict validation. Accepts SS / M:SS / H:MM:SS,
 * rejects malformed input and values outside [0, max]. Commits only valid,
 * in-bounds values; the parent enforces start-before-end ordering.
 */
export default function TimeField({
  label,
  seconds,
  max,
  onCommit,
}: {
  label: string;
  seconds: number;
  max?: number; // upper bound (e.g. video duration); undefined = no bound
  onCommit: (seconds: number) => void;
}) {
  const [text, setText] = useState(formatDuration(seconds));
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the field in sync when the value changes elsewhere (e.g. the slider),
  // but never fight the user while they're typing.
  useEffect(() => {
    if (!focused) setText(formatDuration(seconds));
  }, [seconds, focused]);

  const onChangeText = (t: string) => {
    setText(t);
    const parsed = parseTime(t);
    if (parsed == null) {
      setError('Use mm:ss');
      return;
    }
    if (max != null && parsed > max) {
      setError(`Max ${formatDuration(max)}`);
      return;
    }
    setError(null);
    onCommit(parsed);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {error ? <Text style={styles.err}> · {error}</Text> : null}
      </Text>
      <TextInput
        value={text}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          setText(formatDuration(seconds)); // snap back to the committed value
          setError(null);
        }}
        keyboardType="numbers-and-punctuation"
        placeholder="0:00"
        placeholderTextColor={colors.textFaint}
        style={[styles.input, error ? styles.inputError : null]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {flex: 1},
  label: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  err: {color: colors.danger, textTransform: 'none', letterSpacing: 0},
  input: {
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputError: {borderColor: colors.danger},
});
