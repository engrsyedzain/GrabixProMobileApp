import {Vibration} from 'react-native';

/**
 * A short tactile tick to confirm a primary action (starting a grab, etc.).
 * Best-effort — silently no-ops if the device has no vibrator.
 */
export function tick(): void {
  try {
    Vibration.vibrate(16);
  } catch {
    /* no vibrator — ignore */
  }
}
