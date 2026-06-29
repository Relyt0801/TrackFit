// OverviewTab.tsx — "Übersicht": a compact, scannable progress board. Every exercise the
// user has actually trained is shown by default as a small card (sparkline + current value +
// trend). The selection can be narrowed by search / type or customised explicitly via a
// sheet. Tapping a card opens the detailed per-exercise chart in the Diagramme tab.
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS } from '../theme';
import { fmtDateShort, primarySeries } from '../data/helpers';
import { useStore } from '../store/store';
import { Exercise } from '../types';
import { Icon } from '../components/Icon';
import { AppText, AppTextInput } from '../components/Text';
import {
  Checkbox,
  EmptyState,
  MuscleTag,
  Segmented,
  Sheet,
  PrimaryButton,
  pressedOpacity,
} from '../components/ui';
import { SessionHeaderTitle } from '../components/SessionHeaderTitle';
import { Sparkline } from '../components/charts';

type TypeFilter = 'all' | 'strength' | 'cardio';

export function OverviewTab({ onOpenExercise }: { onOpenExercise: (id: string) => void }) {
  const insets = useSafeAreaInsets();
  const { state } = useStore();
  const { history, exercises } = state;

  // Exercises the user has actually logged at least once — the default selection.
  const trainedIds = useMemo(() => {
    const ids = new Set<string>();
    history.forEach((s) => s.entries.forEach((e) => e.sets.length && ids.add(e.exerciseId)));
    return ids;
  }, [history]);

  // Last training date per exercise, to sort "most recent first".
  const lastDate = useMemo(() => {
    const m: Record<string, string> = {};
    history.forEach((s) =>
      s.entries.forEach((e) => {
        if (!e.sets.length) return;
        if (!m[e.exerciseId] || s.date > m[e.exerciseId]) m[e.exerciseId] = s.date;
      }),
    );
    return m;
  }, [history]);

  // null = follow the default (all trained exercises). Once the user customises the board
  // it becomes an explicit id list; "Zurücksetzen" returns it to null.
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const effectiveSelected = useMemo(() => {
    const base = selectedIds ?? exercises.filter((e) => trainedIds.has(e.id)).map((e) => e.id);
    return new Set(base);
  }, [selectedIds, exercises, trainedIds]);

  const cards = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises
      .filter((e) => effectiveSelected.has(e.id))
      .filter((e) => typeFilter === 'all' || e.type === typeFilter)
      .filter(
        (e) =>
          !q ||
          e.name.toLowerCase().includes(q) ||
          e.equipment.toLowerCase().includes(q),
      )
      .sort((a, b) => (lastDate[b.id] || '').localeCompare(lastDate[a.id] || ''));
  }, [exercises, effectiveSelected, typeFilter, query, lastDate]);

  const topPad = insets.top + 12;
  const customized = selectedIds != null;

  // Nothing trained yet at all → same onboarding hint as the Diagramme tab.
  if (trainedIds.size === 0) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: topPad, paddingHorizontal: 16, paddingBottom: 24 }}>
        <SessionHeaderTitle title="Übersicht" />
        <EmptyState
          icon="grid"
          title="Noch keine Trainings"
          sub="Absolviere ein Training, dann erscheinen hier alle Übungen mit ihrem Verlauf."
        />
      </ScrollView>
    );
  }

  const totalSessions = history.length;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: topPad, paddingHorizontal: 16, paddingBottom: 28 }}
      showsVerticalScrollIndicator={false}
    >
      <SessionHeaderTitle
        title="Übersicht"
        sub={`${effectiveSelected.size} Übung${effectiveSelected.size === 1 ? '' : 'en'} · ${totalSessions} Einheit${totalSessions === 1 ? '' : 'en'}`}
      />

      {/* search + customise */}
      <View style={{ flexDirection: 'row', gap: 9, marginBottom: 11 }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: COLORS.surface2,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 999,
            paddingHorizontal: 13,
          }}
        >
          <Icon name="search" size={16} color={COLORS.muted} />
          <AppTextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Übung suchen"
            placeholderTextColor="rgba(243,245,248,0.30)"
            style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: '600', paddingVertical: 10 }}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Icon name="x" size={15} color={COLORS.muted} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={() => setCustomizeOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Anzeige anpassen"
          style={({ pressed }) => [
            {
              width: 44,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: customized ? COLORS.accent : COLORS.border,
              backgroundColor: customized ? COLORS.accentTint : COLORS.surface2,
            },
            pressedOpacity(pressed),
          ]}
        >
          <Icon name="filter" size={18} color={customized ? COLORS.accent : COLORS.muted} />
        </Pressable>
      </View>

      {/* type filter */}
      <View style={{ marginBottom: 14 }}>
        <Segmented
          options={[
            { value: 'all', label: 'Alle' },
            { value: 'strength', label: 'Kraft' },
            { value: 'cardio', label: 'Cardio' },
          ]}
          value={typeFilter}
          onChange={setTypeFilter}
        />
      </View>

      {cards.length === 0 ? (
        <EmptyState
          icon="search"
          title="Nichts gefunden"
          sub="Keine Übung passt zu Suche und Filter. Passe die Anzeige an oder setze sie zurück."
        />
      ) : (
        cards.map((e) => (
          <OverviewCard key={e.id} ex={e} history={history} onPress={() => onOpenExercise(e.id)} />
        ))
      )}

      <CustomizeSheet
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        exercises={exercises}
        trainedIds={trainedIds}
        selected={effectiveSelected}
        onApply={(ids) => setSelectedIds(ids)}
        onReset={() => setSelectedIds(null)}
        customized={customized}
      />
    </ScrollView>
  );
}

function OverviewCard({
  ex,
  history,
  onPress,
}: {
  ex: Exercise;
  history: ReturnType<typeof useStore>['state']['history'];
  onPress: () => void;
}) {
  const { series, label, unit } = useMemo(() => primarySeries(history, ex), [history, ex]);

  const cur = series.length ? series[series.length - 1].value : null;
  const first = series.length ? series[0].value : null;
  const delta = cur != null && first != null ? cur - first : null;
  const pct = delta != null && first ? Math.round((delta / first) * 100) : null;
  const trendUp = delta != null && delta > 0;
  const trendDown = delta != null && delta < 0;
  const trendColor = trendUp ? COLORS.accent : trendDown ? COLORS.danger : COLORS.muted;

  const fmt = (v: number) => Math.round(v * 100) / 100;
  const lastDateStr = series.length ? fmtDateShort(series[series.length - 1].date) : '–';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${ex.name} öffnen`}
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
          marginBottom: 9,
        },
        pressedOpacity(pressed),
      ]}
    >
      {/* identity */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText numberOfLines={1} style={{ fontSize: 14.5, fontWeight: '800', color: COLORS.text }}>
          {ex.name}
        </AppText>
        <AppText numberOfLines={1} style={{ fontSize: 11.5, color: COLORS.muted, fontWeight: '600', marginTop: 1 }}>
          {ex.equipment} · zuletzt {lastDateStr}
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
          {ex.muscles.slice(0, 2).map((m) => (
            <MuscleTag key={m} m={m} small />
          ))}
        </View>
      </View>

      {/* graph + value */}
      <View style={{ alignItems: 'flex-end' }}>
        <Sparkline points={series} color={trendUp || !trendDown ? COLORS.accent : COLORS.danger} width={84} height={30} />
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 4 }}>
          <AppText style={{ fontSize: 15.5, fontWeight: '800', color: COLORS.text, fontVariant: ['tabular-nums'] }}>
            {cur != null ? fmt(cur) : '–'}
          </AppText>
          {unit ? <AppText style={{ fontSize: 10.5, fontWeight: '700', color: COLORS.muted }}>{unit}</AppText> : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1, height: 14 }}>
          {delta != null && delta !== 0 ? (
            <>
              <Icon name={trendUp ? 'trendUp' : 'trendDown'} size={12} color={trendColor} stroke={2.4} />
              <AppText style={{ fontSize: 11, fontWeight: '800', color: trendColor, fontVariant: ['tabular-nums'] }}>
                {(delta > 0 ? '+' : '') + fmt(delta)}
                {pct != null ? ` (${pct > 0 ? '+' : ''}${pct}%)` : ''}
              </AppText>
            </>
          ) : (
            <AppText style={{ fontSize: 11, fontWeight: '700', color: COLORS.muted }}>
              {label}
            </AppText>
          )}
        </View>
      </View>

      <Icon name="chevR" size={16} color={COLORS.muted} />
    </Pressable>
  );
}

function CustomizeSheet({
  open,
  onClose,
  exercises,
  trainedIds,
  selected,
  onApply,
  onReset,
  customized,
}: {
  open: boolean;
  onClose: () => void;
  exercises: Exercise[];
  trainedIds: Set<string>;
  selected: Set<string>;
  onApply: (ids: string[]) => void;
  onReset: () => void;
  customized: boolean;
}) {
  // Local working copy so toggles only take effect on "Übernehmen".
  const [draft, setDraft] = useState<Set<string>>(selected);

  // Re-seed the draft from the live selection each time the sheet opens.
  React.useEffect(() => {
    if (open) setDraft(new Set(selected));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggle = (id: string) =>
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const trained = exercises.filter((e) => trainedIds.has(e.id));
  const others = exercises.filter((e) => !trainedIds.has(e.id));

  const Row = (e: Exercise, hasData: boolean) => {
    const on = draft.has(e.id);
    return (
      <Pressable
        key={e.id}
        onPress={() => toggle(e.id)}
        style={({ pressed }) => [
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 11,
            padding: 11,
            borderRadius: RADIUS,
            marginBottom: 7,
            borderWidth: 1,
            borderColor: on ? COLORS.accent : COLORS.border,
            backgroundColor: on ? COLORS.accentTint : COLORS.surface2,
          },
          pressedOpacity(pressed),
        ]}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText style={{ fontSize: 14, fontWeight: '700', color: hasData ? COLORS.text : COLORS.muted }}>
            {e.name}
          </AppText>
          <AppText style={{ fontSize: 11.5, color: COLORS.muted, fontWeight: '600', marginTop: 1 }}>
            {e.equipment}
            {!hasData ? ' · keine Daten' : ''}
          </AppText>
        </View>
        <Checkbox checked={on} onChange={() => toggle(e.id)} size={24} />
      </Pressable>
    );
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Anzeige anpassen"
      full
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={() => {
              onReset();
              onClose();
            }}
            accessibilityRole="button"
            disabled={!customized}
            style={({ pressed }) => [
              {
                flex: 1,
                paddingVertical: 15,
                borderRadius: 14,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.surface2,
              },
              customized ? pressedOpacity(pressed) : { opacity: 0.4 },
            ]}
          >
            <AppText style={{ fontSize: 15, fontWeight: '800', color: COLORS.text }}>Zurücksetzen</AppText>
          </Pressable>
          <View style={{ flex: 1.3 }}>
            <PrimaryButton
              label={`Übernehmen${draft.size ? ` (${draft.size})` : ''}`}
              onPress={() => {
                onApply([...draft]);
                onClose();
              }}
            />
          </View>
        </View>
      }
    >
      <AppText style={{ fontSize: 12.5, color: COLORS.muted, fontWeight: '600', marginBottom: 12, lineHeight: 18 }}>
        Wähle, welche Übungen in der Übersicht erscheinen. Standardmäßig werden alle bereits
        absolvierten Übungen angezeigt.
      </AppText>
      {trained.length > 0 ? <AppText style={selHdr}>Mit Verlauf</AppText> : null}
      {trained.map((e) => Row(e, true))}
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
