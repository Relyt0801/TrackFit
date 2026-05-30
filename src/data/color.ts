// color.ts — OKLCH → sRGB conversion (React Native has no oklch()/color-mix() support).
// Muscle-group colors are derived programmatically per the design contract, keeping one
// hue per muscle group while varying lightness/chroma for tag fill / text / border.
import { MUSCLES } from './constants';

function srgbGamma(x: number): number {
  const v = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(1, v));
}

// L: 0..1 lightness, C: chroma, H: hue degrees
export function oklchToRgb(L: number, C: number, H: number): string {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const R = Math.round(srgbGamma(r) * 255);
  const G = Math.round(srgbGamma(g) * 255);
  const B = Math.round(srgbGamma(bl) * 255);
  return `rgb(${R}, ${G}, ${B})`;
}

// muscleColor(key, l, c) → oklch(L C hue) for the muscle's hue.
export function muscleColor(key: string, l = 0.72, c = 0.13): string {
  const m = MUSCLES[key];
  if (!m) return '#888';
  return oklchToRgb(l, c, m.hue);
}
