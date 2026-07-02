// helpers.ts — id/date utilities and history analytics (ports data.jsx helpers).
import { MetricKey, SeriesPoint, Session, SessionEntry } from '../types';

export const uid = (p = 'id'): string =>
  `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const todayKey = (d: Date = new Date()): string =>
  d.toISOString().slice(0, 10);

const MONTHS = [
  'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez',
];

export const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const fmtDateShort = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}.`;
};

export const epley1RM = (w: number, r: number): number =>
  r <= 1 ? w : Math.round(w * (1 + r / 30));

// Most recent recorded sets for an exercise (from history, newest first).
export function lastEntryFor(
  history: Session[],
  exId: string,
  beforeIso?: string,
): SessionEntry | null {
  const sorted = [...history]
    .filter((s) => !beforeIso || s.date < beforeIso)
    .sort((a, b) => b.date.localeCompare(a.date));
  for (const sess of sorted) {
    const e = sess.entries.find((en) => en.exerciseId === exId);
    if (e && e.sets.length) return e;
  }
  return null;
}

export type Aggregate = 'max' | 'sum' | 'avg' | '1rm' | 'first';

// Build a time series for an exercise across history for a given metric/aggregate.
// Multiple sessions on the SAME day are combined into a single point (per-day aggregation),
// so training an exercise twice in one day yields one point, not two stacked on the same x.
export function seriesFor(
  history: Session[],
  exId: string,
  metric: MetricKey,
  agg: Aggregate = 'max',
): SeriesPoint[] {
  const byDay = new Map<string, { vals: number[]; sets: SessionEntry['sets'] }>();
  for (const sess of history) {
    const e = sess.entries.find((en) => en.exerciseId === exId);
    if (!e) continue;
    const vals = e.sets
      .map((s) => s[metric])
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));
    if (!vals.length) continue;
    let bucket = byDay.get(sess.date);
    if (!bucket) {
      bucket = { vals: [], sets: [] };
      byDay.set(sess.date, bucket);
    }
    bucket.vals.push(...vals);
    bucket.sets.push(...e.sets);
  }
  return [...byDay.keys()]
    .sort()
    .map((date) => {
      const { vals, sets } = byDay.get(date)!;
      let v: number;
      if (agg === 'sum') v = vals.reduce((a, b) => a + b, 0);
      else if (agg === 'avg') v = vals.reduce((a, b) => a + b, 0) / vals.length;
      else if (agg === '1rm')
        v = Math.max(
          ...sets.map((s) =>
            epley1RM(
              typeof s.weight === 'number' ? s.weight : 0,
              typeof s.reps === 'number' ? s.reps : 1,
            ),
          ),
        );
      else if (agg === 'first') v = vals[0];
      else v = Math.max(...vals); // 'max' (default)
      return { date, value: Math.round(v * 100) / 100 };
    });
}

// Pick the headline metric for an exercise and build its series — used by the
// overview to render one compact sparkline per exercise without a metric picker.
// Strength → heaviest weight per session (falls back to reps / duration);
// cardio → distance per session (falls back to duration / level).
export interface PrimarySeries {
  series: SeriesPoint[];
  label: string;
  unit: string;
}

export function primarySeries(history: Session[], ex: {
  id: string;
  type: 'strength' | 'cardio';
  metrics: MetricKey[];
}): PrimarySeries {
  const has = (m: MetricKey) => ex.metrics.includes(m);
  let metric: MetricKey;
  let agg: Aggregate = 'max';
  let label = '';
  let unit = '';
  if (ex.type === 'cardio') {
    if (has('distance')) { metric = 'distance'; agg = 'sum'; label = 'Distanz'; unit = 'km'; }
    else if (has('duration')) { metric = 'duration'; agg = 'sum'; label = 'Dauer'; unit = 'min'; }
    else { metric = 'level'; agg = 'max'; label = 'Stufe'; unit = ''; }
  } else {
    // Prefer weight, but for bodyweight exercises (all weights 0) the weight curve is flat at
    // 0 and tells you nothing — fall back to reps so the headline tracks real progress.
    const weightSeries = has('weight') ? seriesFor(history, ex.id, 'weight', 'max') : [];
    const weightUseful = weightSeries.some((p) => p.value > 0);
    if (has('weight') && weightUseful) {
      return { series: weightSeries, label: 'Gewicht', unit: 'kg' };
    }
    if (has('reps')) { metric = 'reps'; agg = 'max'; label = 'Wdh'; unit = 'Wdh'; }
    else if (has('weight')) { metric = 'weight'; agg = 'max'; label = 'Gewicht'; unit = 'kg'; }
    else { metric = 'duration'; agg = 'max'; label = 'Dauer'; unit = 'min'; }
  }
  return { series: seriesFor(history, ex.id, metric, agg), label, unit };
}

// Total training volume (Σ weight × reps) per day for an exercise (same-day sessions summed).
export function volumeSeries(history: Session[], exId: string): SeriesPoint[] {
  const byDay = new Map<string, number>();
  for (const s of history) {
    const e = s.entries.find((en) => en.exerciseId === exId);
    if (!e) continue;
    const v = e.sets.reduce(
      (sum, st) =>
        sum +
        (typeof st.weight === 'number' ? st.weight : 0) *
          (typeof st.reps === 'number' ? st.reps : 0),
      0,
    );
    if (v > 0) byDay.set(s.date, (byDay.get(s.date) || 0) + v);
  }
  return [...byDay.keys()].sort().map((date) => ({ date, value: Math.round(byDay.get(date)!) }));
}
