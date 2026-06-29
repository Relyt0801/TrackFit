// constants.ts — muscle groups, equipment categories, metric definitions.
import { MetricDef, MetricKey, Muscle } from '../types';

// ── Muscle groups (simplified, German). hue drives the OKLCH tag color. ──
export const MUSCLES: Record<string, Muscle> = {
  brust: { name: 'Brust', hue: 18 },
  oberer_ruecken: { name: 'Oberer Rücken', hue: 248 },
  unterer_ruecken: { name: 'Unterer Rücken', hue: 286 },
  schultern: { name: 'Schultern', hue: 52 },
  nacken: { name: 'Nacken', hue: 70 },
  bizeps: { name: 'Bizeps', hue: 150 },
  trizeps: { name: 'Trizeps', hue: 172 },
  unterarme: { name: 'Unterarme', hue: 120 },
  bauch: { name: 'Bauch', hue: 330 },
  quadrizeps: { name: 'Quadrizeps', hue: 205 },
  beinbeuger: { name: 'Beinbeuger', hue: 228 },
  gesaess: { name: 'Gesäß', hue: 305 },
  waden: { name: 'Waden', hue: 95 },
  ausdauer: { name: 'Ausdauer', hue: 200 },
};

// ── Equipment categories ──
export const EQUIPMENT = [
  'Langhantel',
  'Kurzhantel',
  'Maschine',
  'Kabelzug',
  'Körpergewicht',
  'Cardio',
];

// ── Metric definitions (what a set tracks) ──
export const METRICS: Record<MetricKey, MetricDef> = {
  weight: { label: 'Gewicht', short: 'kg', unit: 'kg', step: 2.5, dec: 1 },
  reps: { label: 'Wdh', short: 'Wdh', unit: '', step: 1, dec: 0 },
  level: { label: 'Stufe', short: 'Stufe', unit: '', step: 1, dec: 0 },
  duration: { label: 'Dauer', short: 'min', unit: 'min', step: 1, dec: 0 },
  distance: { label: 'Distanz', short: 'km', unit: 'km', step: 0.1, dec: 2 },
  incline: { label: 'Steigung', short: '%', unit: '%', step: 0.5, dec: 1 },
};
