// Grabix Pro palette — electric-blue/cyan on a cool navy-black, aligned with the
// crystalline launcher icon. Coral is reserved for destructive/alerts only.
export const colors = {
  bg: '#0A0F16',
  surface: '#141C27',
  surfaceAlt: '#1B2531',
  border: '#24303E',
  primary: '#22B6FF', // electric blue (brand)
  primary2: '#45E0E6', // cyan highlight (gradients/accents)
  primaryDim: '#0E7FBF',
  onPrimary: '#04212F', // dark text that reads on the bright accent
  text: '#EAF2FB',
  textDim: '#8798A9',
  textFaint: '#566578',
  success: '#34D399',
  danger: '#FB7185', // coral — destructive / errors only
  warning: '#FBBF24',
};

export const spacing = (n: number) => n * 4;

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/**
 * Parse a time string into whole seconds. Accepts SS, M:SS, MM:SS, H:MM:SS.
 * Returns null if the format is invalid or a minutes/seconds part is >= 60.
 */
export function parseTime(input: string): number | null {
  const s = input.trim();
  if (!/^\d{1,3}(:\d{1,2}){0,2}$/.test(s)) return null;
  const parts = s.split(':').map(Number);
  if (parts.some(p => Number.isNaN(p))) return null;
  // For multi-part times, all but the leading part must be < 60.
  for (let i = 1; i < parts.length; i++) {
    if (parts[i] >= 60) return null;
  }
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}
