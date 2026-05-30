// StatsTab.tsx — per-exercise progress charts: metric switch, date range, records.
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS } from '../theme';
import { seriesFor, todayKey, volumeSeries, Aggregate } from '../data/helpers';
import { useStore } from '../store/store';
import { Exercise, MetricKey } from '../types';
import { Icon } from '../components/Icon';
import { AppText } from '../components/Text';
import { Chip, EmptyState, MuscleTag, Segmented, Sheet, pressedOpacity } from '../components/ui';
import { SessionHeaderTitle } from '../components/SessionHeaderTitle';
import { LineChart } from '../components/charts';

interface MetricOpt {
  id: string;
  label: string;
  unit: string;
  metric?: MetricKey;
  agg?: Aggregate;
  special?: 'volume';
}

const METRIC_OPTS: Record<string, MetricOpt[]> = {
  strength: [
    { id: 'weight', label: 'Gewicht', unit: ' kg', metric: 'weight', agg: 'max' },
    { id: '1rm', label: '1RM', unit: ' kg', metric: 'weight', agg: '1rm' },
    { id: 'reps', label: 'Wdh', unit: '', metric: 'reps', agg: 'max' },
    { id: 'volume', label: 'Volumen', unit: ' kg', special: 'volume' },
  ],
  cardio: [
    { id: 'distance', label: 'Distanz', unit: ' km', metric: 'distance', agg: 'sum' },
    { id: 'duration', label: 'Dauer', unit: ' min', metric: 'duration', agg: 'sum' },
    { id: 'level', label: 'Stufe', unit: '', metric: 'level', agg: 'max' },
  ],
};
const RANGES = [
  { id: 28, label: '4 Wo' },
  { id: 84, label: '12 Wo' },
  { id: 182, label: '6 Mo' },
  { id: 9999, label: 'Alles' },
];

export function StatsTab({
  focusEx,
  setFocusEx,
}: {
  focusEx: string | null;
  setFocusEx: (id: string | null) => void;
}) {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const { history, exercises } = store.state;
  const exMap = useMemo(() => Object.fromEntries(exercises.map((e) => [e.id, e])), [exercises]);
  const withHistory = useMemo(() => {
    const ids = new Set(history.flatMap((s) => s.entries.map((e) => e.exerciseId)));
    return exercises.filter((e) => ids.has(e.id));
  }, [history, exercises]);

  const [exId, setExId] = useState<string | null>(null);
  const [metricId, setMetricId] = useState<string | null>(null);
  const [range, setRange] = useState<number>(84);
  const [pickOpen, setPickOpen] = useState(false);

  useEffect(() => {
    const want =
      focusEx && exMap[focusEx]
        ? focusEx
        : (withHistory[0] && withHistory[0].id) || (exercises[0] && exercises[0].id);
    if (want && want !== exId) {
      setExId(want);
      if (setFocusEx) setFocusEx(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusEx, withHistory]);

  const ex: Exercise | null = exId ? exMap[exId] : null;
  const opts = ex
    ? (METRIC_OPTS[ex.type] || METRIC_OPTS.strength).filter(
        (o) => o.special || (ex.metrics || []).includes(o.metric as MetricKey),
      )
    : [];
  useEffect(() => {
    if (opts.length && !opts.find((o) => o.id === metricId)) setMetricId(opts[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exId, opts.length]);
  const opt = opts.find((o) => o.id === metricId) || opts[0];

  const topPad = insets.top + 12;

  if (!ex) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: topPad, paddingHorizontal: 16, paddingBottom: 24 }}>
        <SessionHeaderTitle title="Diagramme" />
        <EmptyState
          icon="chart"
          title="Noch keine Übungen"
          sub="Lege in den Einstellungen Übungen an und absolviere ein Training."
        />
      </ScrollView>
    );
  }

  const fullSeries = opt
    ? opt.special === 'volume'
      ? volumeSeries(history, exId!)
      : seriesFor(history, exId!, opt.metric as MetricKey, opt.agg)
    : [];
  const cutoff = todayKey(new Date(Date.now() - range * 86400000));
  const series = range >= 9999 ? fullSeries : fullSeries.filter((p) => p.date >= cutoff);
  const sessionCount = series.length;
  const cur = series.length ? series[series.length - 1].value : null;
  const best = series.length ? Math.max(...series.map((p) => p.value)) : null;
  const first = series.length ? series[0].value : null;
  const delta = cur != null && first != null ? cur - first : null;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: topPad, paddingHorizontal: 16, paddingBottom: 28 }}
      showsVerticalScrollIndicator={false}
    >
      <SessionHeaderTitle title="Diagramme" />

      {/* exercise selector */}
      <Pressable
        onPress={() => setPickOpen(true)}
        style={({ pressed }) => [
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 12,
            borderRadius: RADIUS,
            borderWidth: 1,
            borderColor: COLORS.border,
            backgroundColor: COLORS.surface,
            marginBottom: 12,
          },
          pressedOpacity(pressed),
        ]}
      >
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 11,
            backgroundColor: COLORS.accentTint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="chart" size={20} color={COLORS.accent} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText style={{ fontSize: 15.5, fontWeight: '800', color: COLORS.text }}>{ex.name}</AppText>
          <AppText style={{ fontSize: 12, color: COLORS.muted, fontWeight: '600', marginTop: 1 }}>
            {ex.equipment} · Übung wechseln
          </AppText>
        </View>
        <Icon name="chevD" size={18} color={COLORS.muted} />
      </Pressable>

      {/* metric chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 7, paddingBottom: 9 }}
        style={{ marginBottom: 4 }}
      >
        {opts.map((o) => (
          <Chip key={o.id} active={o.id === metricId} onPress={() => setMetricId(o.id)}>
            {o.label}
          </Chip>
        ))}
      </ScrollView>

      {/* chart card */}
      <View
        style={{
          backgroundColor: COLORS.surface,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: RADIUS,
          paddingTop: 14,
          paddingBottom: 8,
          paddingLeft: 6,
          paddingRight: 8,
          marginBottom: 12,
        }}
      >
        <View style={{ paddingHorizontal: 10, paddingBottom: 8 }}>
          <AppText style={{ fontSize: 12.5, fontWeight: '800', color: COLORS.text }}>
            {opt ? opt.label : ''}
            {opt && opt.agg === 'max' ? ' (max/Satz)' : ''}
          </AppText>
          <AppText style={{ fontSize: 10.5, color: COLORS.muted, fontWeight: '600' }}>
            {sessionCount} Trainingseinheiten
          </AppText>
        </View>
        <LineChart points={series} color={COLORS.accent} unit={opt ? opt.unit.trim() : ''} height={200} />
      </View>

      {/* range */}
      <View style={{ marginBottom: 14 }}>
        <Segmented options={RANGES.map((r) => ({ value: r.id, label: r.label }))} value={range} onChange={setRange} />
      </View>

      {/* stat cards */}
      <View style={{ flexDirection: 'row', gap: 9, marginBottom: 16 }}>
        <StatCard label="Aktuell" value={cur != null ? cur + (opt?.unit ?? '') : '–'} />
        <StatCard label="Bestwert" value={best != null ? best + (opt?.unit ?? '') : '–'} accent />
        <StatCard
          label="seit Start"
          value={delta != null ? (delta >= 0 ? '+' : '') + Math.round(delta * 100) / 100 + (opt?.unit ?? '') : '–'}
          good={delta != null && delta >= 0}
        />
      </View>

      {/* muscles */}
      <AppText
        style={{
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.5,
          color: COLORS.muted,
          textTransform: 'uppercase',
          marginBottom: 9,
        }}
      >
        Angesprochene Muskelgruppen
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 6 }}>
        {ex.muscles.map((m) => (
          <MuscleTag key={m} m={m} />
        ))}
      </View>

      <ExerciseSelectSheet
        open={pickOpen}
        onClose={() => setPickOpen(false)}
        exercises={exercises}
        withHistory={withHistory}
        onPick={(id) => {
          setExId(id);
          setPickOpen(false);
        }}
        current={exId}
      />
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  accent,
  good,
}: {
  label: string;
  value: string;
  accent?: boolean;
  good?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        paddingVertical: 11,
        paddingHorizontal: 10,
      }}
    >
      <AppText style={{ fontSize: 9.5, fontWeight: '700', letterSpacing: 0.5, color: COLORS.muted, textTransform: 'uppercase' }}>
        {label}
      </AppText>
      <AppText
        numberOfLines={1}
        style={{
          fontSize: 17,
          fontWeight: '800',
          marginTop: 4,
          fontVariant: ['tabular-nums'],
          color: accent ? COLORS.accent : good === true ? COLORS.accent : COLORS.text,
        }}
      >
        {value}
      </AppText>
    </View>
  );
}

function ExerciseSelectSheet({
  open,
  onClose,
  exercises,
  withHistory,
  onPick,
  current,
}: {
  open: boolean;
  onClose: () => void;
  exercises: Exercise[];
  withHistory: Exercise[];
  onPick: (id: string) => void;
  current: string | null;
}) {
  const histIds = new Set(withHistory.map((e) => e.id));
  const others = exercises.filter((e) => !histIds.has(e.id));

  const Row = (e: Exercise, hasData: boolean) => (
    <Pressable
      key={e.id}
      onPress={() => onPick(e.id)}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 11,
          padding: 11,
          borderRadius: RADIUS,
          marginBottom: 7,
          borderWidth: 1,
          borderColor: e.id === current ? COLORS.accent : COLORS.border,
          backgroundColor: e.id === current ? COLORS.accentTint : COLORS.surface2,
        },
        pressedOpacity(pressed),
      ]}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText style={{ fontSize: 14, fontWeight: '700', color: hasData ? COLORS.text : COLORS.muted }}>{e.name}</AppText>
        <AppText style={{ fontSize: 11.5, color: COLORS.muted, fontWeight: '600', marginTop: 1 }}>
          {e.equipment}
          {!hasData ? ' · keine Daten' : ''}
        </AppText>
      </View>
      {e.id === current ? <Icon name="check" size={17} color={COLORS.accent} stroke={3} /> : null}
    </Pressable>
  );

  return (
    <Sheet open={open} onClose={onClose} title="Übung wählen" full>
      {withHistory.length > 0 ? <AppText style={selHdr}>Mit Verlauf</AppText> : null}
      {withHistory.map((e) => Row(e, true))}
      {others.length > 0 ? <AppText style={[selHdr, { marginTop: 8 }]}>Weitere Übungen</AppText> : null}
      {others.map((e) => Row(e, false))}
      <View style={{ height: 12 }} />
    </Sheet>
  );
}

const selHdr = {
  fontSize: 11,
  fontWeight: '700' as const,
  letterSpacing: 0.5,
  color: COLORS.muted,
  textTransform: 'uppercase' as const,
  marginHorizontal: 2,
  marginBottom: 9,
};
