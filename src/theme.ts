// theme.ts — shipped design tokens (dark theme, orange accent, "Weich" radii, Manrope).
// The prototype's tweaks playground (accent picker, font/card/density switchers) is NOT
// shipped — these are the chosen defaults baked in as tokens.
import { Platform } from 'react-native';

export const COLORS = {
  bg: '#0c0d11',
  surface: '#16181d',
  surface2: '#1f222a',
  border: '#272a32',
  borderStrong: '#363b46',
  text: '#f3f5f8',
  muted: '#888e9c',
  danger: '#ff6f6f',
  good: '#34d399',
  goodTint: 'rgba(52,211,153,0.14)',
  dangerTint: 'rgba(255,111,111,0.14)',
  accent: '#ff8a3d',
  accentInk: '#0d0f08',
  // color-mix(in srgb, accent X%, transparent) precomputed for #ff8a3d → rgb(255,138,61)
  accentTint: 'rgba(255,138,61,0.15)',
  accentGlow: 'rgba(255,138,61,0.30)',
  // translucent tab-bar background ≈ color-mix(in srgb, bg 82%, transparent)
  tabBarBg: 'rgba(12,13,17,0.92)',
  scrim: 'rgba(0,0,0,0.55)',
} as const;

// Default card style "Weich"
export const RADIUS = 18;

export const MONO = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
}) as string;

// Map a CSS-style numeric/string fontWeight to the matching loaded Manrope variant.
// RN custom fonts require selecting the family per weight (fontWeight alone won't switch it).
export function fontFor(weight?: number | string): string {
  let n = 400;
  if (typeof weight === 'number') n = weight;
  else if (typeof weight === 'string') {
    if (weight === 'bold') n = 700;
    else if (weight === 'normal') n = 400;
    else n = parseInt(weight, 10) || 400;
  }
  if (n >= 800) return 'Manrope_800ExtraBold';
  if (n >= 700) return 'Manrope_700Bold';
  if (n >= 600) return 'Manrope_600SemiBold';
  if (n >= 500) return 'Manrope_500Medium';
  return 'Manrope_400Regular';
}
