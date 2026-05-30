// TrainingTab.tsx — active training session: start screen, exercise cards, set entry
// with faded "last time" placeholders, done-sinks-to-bottom, rest timer, finish.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, TextStyle, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS } from '../theme';
import { METRICS } from '../data/constants';
import { muscleColor } from '../data/color';
import { lastEntryFor, todayKey, uid } from '../data/helpers';
import { useStore } from '../store/store';
import {
  Exercise,
  MetricKey,
  Session,
  SessionEntry,
  SetEntry,
} from '../types';
import { Icon } from '../components/Icon';
import { AppText } from '../components/Text';
import {
  Checkbox,
  EmptyState,
  ExerciseThumb,
  MuscleTag,
  Stepper,
} from '../components/ui';
import { ExercisePickerSheet } from '../forms/ExerciseForms';
import { FinishSummary } from '../store/store';

// ── Rest timer ──
function RestTimer() {
  const [end, setEnd] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!end) return;
    const i = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(i);
  }, [end]);
  const remaining = end ? Math.max(0, Math.ceil((end - now) / 1000)) : 0;
  useEffect(() => {
    if (end && remaining === 0) setEnd(null);
  }, [remaining, end]);
  const start = (s: number) => setEnd(Date.now() + s * 1000);
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[60, 90, 120].map((s) => (
        <Pressable
          key={s}
          onPress={() => start(s)}
          style={{
            flex: 1,
            paddingVertical: 9,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
            backgroundColor: COLORS.surface2,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <Icon name="timer" size={14} color={COLORS.muted} />
          <AppText style={{ color: COLORS.muted, fontSize: 12.5, fontWeight: '700' }}>{s}s</AppText>
        </Pressable>
      ))}
      {end && remaining > 0 ? (
        <Pressable
          onPress={() => setEnd(null)}
          style={{
            flex: 1.2,
            paddingVertical: 9,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.accent,
            backgroundColor: COLORS.accentTint,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <Icon name="stop" size={13} color={COLORS.accent} />
          <AppText style={{ color: COLORS.accent, fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
            {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

function fmtDur(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

const setHasValue = (set: SetEntry, metrics: MetricKey[]) =>
  metrics.some((mk) => typeof set[mk] === 'number' && !isNaN(set[mk] as number));

// ── A single set row ──
function SetRow({
  idx,
  set,
  metrics,
  prev,
  onChange,
  onRemove,
  canRemove,
}: {
  idx: number;
  set: SetEntry;
  metrics: MetricKey[];
  prev?: SetEntry;
  onChange: (s: SetEntry) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const done = !!set.done;
  const cols = Math.min(metrics.length, 2);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 26, alignItems: 'center', justifyContent: 'center' }}>
        <AppText
          style={{
            fontSize: 13,
            fontWeight: '800',
            color: done ? COLORS.accent : COLORS.muted,
            fontVariant: ['tabular-nums'],
          }}
        >
          {idx + 1}
        </AppText>
        {canRemove ? (
          <Pressable
            onPress={onRemove}
            hitSlop={8}
            style={{
              position: 'absolute',
              top: -8,
              left: -6,
              width: 16,
              height: 16,
              borderRadius: 9,
              backgroundColor: COLORS.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="x" size={11} color={COLORS.muted} />
          </Pressable>
        ) : null}
      </View>
      <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {metrics.map((mk) => (
          <View key={mk} style={{ flexGrow: 1, flexBasis: cols === 1 ? '100%' : '46%' }}>
            <Stepper
              metricKey={mk}
              value={set[mk] == null ? '' : (set[mk] as number | '')}
              placeholder={prev && typeof prev[mk] === 'number' ? (prev[mk] as number) : null}
              accent
              onChange={(v) => onChange({ ...set, [mk]: v })}
            />
          </View>
        ))}
      </View>
      <Checkbox
        checked={done}
        onChange={(c) => {
          const ns: SetEntry = { ...set, done: c };
          if (c)
            metrics.forEach((mk) => {
              if (ns[mk] == null || ns[mk] === '') {
                if (prev && typeof prev[mk] === 'number') (ns as any)[mk] = prev[mk];
              }
            });
          onChange(ns);
        }}
      />
    </View>
  );
}

function setSummary(sets: SetEntry[], metrics: MetricKey[]): string {
  const doneSets = sets.filter((s) => s.done);
  const wr = metrics.includes('weight') && metrics.includes('reps');
  const parts = doneSets.map((s) => {
    if (wr) return `${s.weight != null ? s.weight : '–'} kg × ${s.reps != null ? s.reps : '–'}`;
    return metrics
      .map((mk) => (s[mk] == null ? '–' : `${s[mk]}${METRICS[mk].unit ? ' ' + METRICS[mk].unit : ''}`))
      .join(' · ');
  });
  const shown = parts.slice(0, 3).join('   ·   ');
  return parts.length > 3 ? `${shown}  +${parts.length - 3}` : shown;
}

// ── An exercise card within the active session ──
function ExerciseCard({
  entry,
  exercise,
  prev,
  done,
  onUpdate,
  onRemove,
}: {
  entry: SessionEntry;
  exercise: Exercise;
  prev: SessionEntry | null;
  done: boolean;
  onUpdate: (e: SessionEntry) => void;
  onRemove: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState(false);
  const accent = muscleColor(exercise.muscles[0] || 'ausdauer', 0.8, 0.13);
  const setSets = (sets: SetEntry[]) => onUpdate({ ...entry, sets });
  const updateSet = (i: number, ns: SetEntry) => setSets(entry.sets.map((s, j) => (j === i ? ns : s)));
  const addSet = () => setSets([...entry.sets, { done: false }]);
  const removeSet = (i: number) => setSets(entry.sets.filter((_, j) => j !== i));
  const doneCount = entry.sets.filter((s) => s.done).length;
  const bodyOpen = done ? editing : !collapsed;
  const toggle = () => (done ? setEditing((e) => !e) : setCollapsed((c) => !c));

  const openMenu = () => {
    Alert.alert(exercise.name, undefined, [
      {
        text: done ? 'Bearbeiten' : collapsed ? 'Aufklappen' : 'Zuklappen',
        onPress: () => (done ? setEditing(true) : setCollapsed((c) => !c)),
      },
      { text: 'Entfernen', style: 'destructive', onPress: onRemove },
      { text: 'Abbrechen', style: 'cancel' },
    ]);
  };

  return (
    <View
      style={{
        borderRadius: RADIUS,
        borderWidth: 1,
        borderColor: done && !editing ? COLORS.border : editing ? COLORS.accent : COLORS.borderStrong,
        backgroundColor: COLORS.surface,
        overflow: 'hidden',
        opacity: done && !editing ? 0.66 : 1,
      }}
    >
      {/* header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 12,
          paddingRight: 12,
          paddingLeft: 14,
          borderLeftWidth: 3,
          borderLeftColor: accent,
        }}
      >
        <Pressable onPress={toggle} style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            {done ? <Icon name="check" size={15} stroke={3} color={COLORS.accent} /> : null}
            <AppText style={{ fontSize: 15.5, fontWeight: '800', color: COLORS.text, letterSpacing: -0.2, flexShrink: 1 }}>
              {exercise.name}
            </AppText>
          </View>
          {done && !editing ? (
            <AppText
              numberOfLines={1}
              style={{ fontSize: 12, color: COLORS.muted, fontWeight: '700', marginTop: 5, fontVariant: ['tabular-nums'] }}
            >
              {setSummary(entry.sets, exercise.metrics)}
            </AppText>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {exercise.muscles.map((m) => (
                <MuscleTag key={m} m={m} small />
              ))}
            </View>
          )}
        </Pressable>
        {!(done && !editing) ? (
          <AppText style={{ fontSize: 11, fontWeight: '700', color: COLORS.muted, fontVariant: ['tabular-nums'] }}>
            {doneCount}/{entry.sets.length}
          </AppText>
        ) : null}
        <Pressable onPress={openMenu} hitSlop={6} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="dots" size={18} color={COLORS.muted} />
        </Pressable>
        {done && !editing ? (
          <Pressable
            onPress={() => setEditing(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingVertical: 6,
              paddingHorizontal: 11,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: COLORS.borderStrong,
              backgroundColor: COLORS.surface2,
            }}
          >
            <Icon name="edit" size={14} color={COLORS.text} />
            <AppText style={{ fontSize: 12, fontWeight: '700', color: COLORS.text }}>Bearbeiten</AppText>
          </Pressable>
        ) : (
          <Pressable onPress={toggle} hitSlop={6}>
            <Icon
              name="chevD"
              size={18}
              color={COLORS.muted}
              style={{ transform: [{ rotate: bodyOpen ? '0deg' : '-90deg' }] }}
            />
          </Pressable>
        )}
      </View>

      {bodyOpen ? (
        <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
          <View style={{ marginBottom: 10 }}>
            <ExerciseThumb h={104} label={exercise.name} />
          </View>
          {prev && !done ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <Icon name="clock" size={12} color={COLORS.muted} />
              <AppText style={{ fontSize: 10.5, color: COLORS.muted, fontWeight: '600' }}>
                Letztes Mal blass hinterlegt — tippe zum Übernehmen
              </AppText>
            </View>
          ) : null}
          {done && editing ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <Icon name="edit" size={12} color={COLORS.accent} />
              <AppText style={{ fontSize: 10.5, color: COLORS.accent, fontWeight: '700' }}>
                Erledigte Übung bearbeiten — Werte anpassen
              </AppText>
            </View>
          ) : null}
          <View style={{ gap: 8 }}>
            {entry.sets.map((s, i) => (
              <SetRow
                key={i}
                idx={i}
                set={s}
                metrics={exercise.metrics}
                prev={prev ? prev.sets[i] : undefined}
                onChange={(ns) => updateSet(i, ns)}
                onRemove={() => removeSet(i)}
                canRemove={entry.sets.length > 1}
              />
            ))}
          </View>
          <Pressable
            onPress={addSet}
            style={{
              marginTop: 10,
              paddingVertical: 9,
              borderRadius: 11,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: COLORS.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Icon name="plus" size={15} color={COLORS.muted} />
            <AppText style={{ color: COLORS.muted, fontSize: 13, fontWeight: '700' }}>Satz hinzufügen</AppText>
          </Pressable>
          {done && editing ? (
            <Pressable
              onPress={() => setEditing(false)}
              style={{
                marginTop: 10,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: COLORS.accent,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
              }}
            >
              <Icon name="check" size={16} stroke={3} color={COLORS.accentInk} />
              <AppText style={{ color: COLORS.accentInk, fontSize: 14, fontWeight: '800' }}>Änderungen speichern</AppText>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function makeEntry(exId: string, history: Session[]): SessionEntry {
  const prev = lastEntryFor(history, exId);
  const n = prev ? Math.max(1, prev.sets.length) : 3;
  return { exerciseId: exId, sets: Array.from({ length: n }, () => ({ done: false })) };
}

const GREET_SUBS = [
  'Zeit, etwas zu bewegen.',
  'Heute ein bisschen besser als gestern.',
  'Jeder Satz bringt dich weiter.',
  'Stark, dass du wieder da bist.',
  'Disziplin schlägt Motivation.',
  'Auf geht’s – du packst das.',
  'Bereit für die nächste Bestleistung?',
  'Konsequenz ist deine Superpower.',
  'Dein zukünftiges Ich dankt dir.',
  'Lass die Hanteln sprechen.',
  'Kleine Schritte, große Wirkung.',
  'Wer hier ist, hat schon gewonnen.',
  'Volle Power – los geht’s!',
  'Du wächst an jedem Gewicht.',
];

function buildGreeting(name: string) {
  const h = new Date().getHours();
  const tod =
    h < 5 ? 'Noch wach' : h < 11 ? 'Guten Morgen' : h < 17 ? 'Guten Tag' : h < 22 ? 'Guten Abend' : 'Späte Stunde';
  const nm = (name || '').trim();
  const title = nm ? `${tod}, ${nm}!` : `${tod}!`;
  const sub = GREET_SUBS[Math.floor(Math.random() * GREET_SUBS.length)];
  return { title, sub };
}

const isDone = (entry: SessionEntry) => entry.sets.length > 0 && entry.sets.every((s) => s.done);

export function TrainingTab({ onFinish }: { onFinish: (s: FinishSummary | null) => void }) {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const { session, history, exercises, plans, profile } = store.state;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [viewMenu, setViewMenu] = useState(false);
  const [now, setNow] = useState(Date.now());
  const exMap = useMemo(() => Object.fromEntries(exercises.map((e) => [e.id, e])), [exercises]);

  useEffect(() => {
    if (!session) setViewMenu(false);
  }, [session]);
  useEffect(() => {
    if (!session) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [session]);

  const greeting = useMemo(() => buildGreeting(profile.name), [profile.name, !!session, viewMenu]);

  const doStart = (planId: string | null) => {
    const plan = plans.find((p) => p.id === planId);
    const exIds = plan ? plan.exerciseIds : [];
    const entries = exIds.map((id) => makeEntry(id, history));
    store.setSession({
      id: uid('sess'),
      date: todayKey(),
      planId: planId || null,
      startedAt: new Date().toISOString(),
      entries,
    });
    setViewMenu(false);
  };
  const startSession = (planId: string | null) => {
    if (session) {
      Alert.alert('Training läuft', 'Aktuelles Training verwerfen und ein neues starten?', [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Neu starten', style: 'destructive', onPress: () => doStart(planId) },
      ]);
    } else doStart(planId);
  };

  const addExercises = (ids: string[]) => {
    store.setSession((s) =>
      s
        ? {
            ...s,
            entries: [
              ...s.entries,
              ...ids.filter((id) => !s.entries.some((e) => e.exerciseId === id)).map((id) => makeEntry(id, history)),
            ],
          }
        : s,
    );
    setPickerOpen(false);
  };
  const updateEntry = (exId: string, ne: SessionEntry) =>
    store.setSession((s) => (s ? { ...s, entries: s.entries.map((e) => (e.exerciseId === exId ? ne : e)) } : s));
  const removeEntry = (exId: string) =>
    store.setSession((s) => (s ? { ...s, entries: s.entries.filter((e) => e.exerciseId !== exId) } : s));

  const finish = () => {
    if (!session) return;
    const elapsed = Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000);
    const entries = session.entries
      .map((e) => ({
        exerciseId: e.exerciseId,
        sets: e.sets
          .filter((s) => s.done && setHasValue(s, (exMap[e.exerciseId] || ({} as Exercise)).metrics || []))
          .map((s) => {
            const c = { ...s };
            delete c.done;
            return c;
          }),
      }))
      .filter((e) => e.sets.length);
    if (entries.length)
      store.pushHistory({
        id: session.id,
        date: session.date,
        planId: session.planId,
        startedAt: session.startedAt,
        durationSec: elapsed,
        entries,
      });
    store.setSession(null);
    onFinish(entries.length ? { count: entries.length, exIds: entries.map((e) => e.exerciseId) } : null);
  };

  const topPad = insets.top + 12;

  // ── Menu / start screen ──
  if (!session || viewMenu) {
    const liveDone = session ? session.entries.filter(isDone).length : 0;
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: topPad, paddingHorizontal: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 18 }}>
          <AppText style={{ fontSize: 26, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5, lineHeight: 29 }}>
            {greeting.title}
          </AppText>
          <AppText style={{ fontSize: 14.5, color: COLORS.accent, fontWeight: '700', marginTop: 4 }}>{greeting.sub}</AppText>
        </View>

        {session ? (
          <Pressable
            onPress={() => setViewMenu(false)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: RADIUS,
              borderWidth: 1,
              borderColor: COLORS.accent,
              backgroundColor: COLORS.accentTint,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: COLORS.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="play" size={20} color={COLORS.accentInk} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText style={{ fontSize: 15, fontWeight: '800', color: COLORS.text }}>Training läuft</AppText>
              <AppText style={{ fontSize: 12.5, color: COLORS.muted, fontWeight: '600', marginTop: 1 }}>
                {liveDone}/{session.entries.length} erledigt · fortsetzen
              </AppText>
            </View>
            <Icon name="chevR" size={18} color={COLORS.accent} />
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => startSession(null)}
          style={{
            padding: 18,
            borderRadius: RADIUS,
            backgroundColor: session ? COLORS.surface : COLORS.accent,
            borderWidth: session ? 1 : 0,
            borderColor: COLORS.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 9,
            marginBottom: 18,
          }}
        >
          <Icon name="play" size={20} color={session ? COLORS.text : COLORS.accentInk} />
          <AppText style={{ fontSize: 16.5, fontWeight: '800', letterSpacing: 0.2, color: session ? COLORS.text : COLORS.accentInk }}>
            {session ? 'Neues freies Training' : 'Freies Training starten'}
          </AppText>
        </Pressable>

        <AppText
          style={{
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.6,
            color: COLORS.muted,
            textTransform: 'uppercase',
            marginHorizontal: 2,
            marginTop: 4,
            marginBottom: 10,
          }}
        >
          Trainingspläne
        </AppText>
        <View style={{ gap: 10 }}>
          {plans.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => startSession(p.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                borderRadius: RADIUS,
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.surface,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: COLORS.accentTint,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="dumbbell" size={22} color={COLORS.accent} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText style={{ fontSize: 15, fontWeight: '800', color: COLORS.text }}>{p.name}</AppText>
                <AppText style={{ fontSize: 12.5, color: COLORS.muted, fontWeight: '600', marginTop: 2 }}>
                  {p.exerciseIds.length} Übungen
                </AppText>
              </View>
              <Icon name="chevR" size={18} color={COLORS.muted} />
            </Pressable>
          ))}
          {plans.length === 0 ? (
            <EmptyState icon="dumbbell" title="Noch keine Pläne" sub="Lege Trainingspläne in den Einstellungen an." />
          ) : null}
        </View>
      </ScrollView>
    );
  }

  // ── Active session ──
  const elapsed = Math.round((now - new Date(session.startedAt).getTime()) / 1000);
  const sorted = session.entries
    .map((e, i) => ({ e, i, done: isDone(e) }))
    .sort((a, b) => (a.done === b.done ? a.i - b.i : a.done ? 1 : -1));
  const plan = plans.find((p) => p.id === session.planId);
  const doneN = session.entries.filter(isDone).length;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: topPad, paddingHorizontal: 16, paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Pressable
          onPress={() => setViewMenu(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingVertical: 7,
            paddingRight: 12,
            paddingLeft: 9,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: COLORS.border,
            backgroundColor: COLORS.surface2,
          }}
        >
          <Icon name="chevL" size={16} color={COLORS.text} />
          <AppText style={{ fontSize: 12.5, fontWeight: '700', color: COLORS.text }}>Übersicht</AppText>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 9,
              backgroundColor: COLORS.accent,
              shadowColor: COLORS.accent,
              shadowOpacity: 1,
              shadowRadius: 4,
              elevation: 3,
            }}
          />
          <AppText style={{ fontSize: 11.5, fontWeight: '800', color: COLORS.accent, letterSpacing: 0.3, textTransform: 'uppercase' }}>
            läuft
          </AppText>
        </View>
      </View>

      <RestTimer />

      <View style={{ flexDirection: 'row', gap: 10, marginVertical: 12 }}>
        <View style={statBox}>
          <AppText style={statLbl}>Trainingszeit</AppText>
          <View style={statValRow}>
            <Icon name="clock" size={15} color={COLORS.accent} />
            <AppText style={statValText}>{fmtDur(elapsed)}</AppText>
          </View>
        </View>
        <View style={statBox}>
          <AppText style={statLbl}>Fortschritt</AppText>
          <View style={statValRow}>
            <AppText style={statValText}>
              {doneN}/{session.entries.length} erledigt
            </AppText>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <AppText style={{ fontSize: 13, fontWeight: '800', color: COLORS.text }}>{plan ? plan.name : 'Freies Training'}</AppText>
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 7,
            paddingHorizontal: 12,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: COLORS.accent,
            backgroundColor: COLORS.accentTint,
          }}
        >
          <Icon name="plus" size={15} color={COLORS.accent} />
          <AppText style={{ fontSize: 12.5, fontWeight: '800', color: COLORS.accent }}>Übung</AppText>
        </Pressable>
      </View>

      <View style={{ gap: 11 }}>
        {session.entries.length === 0 ? (
          <EmptyState icon="dumbbell" title="Noch keine Übung" sub="Tippe oben auf „Übung“, um zu starten." />
        ) : null}
        {sorted.map(({ e, done }) => (
          <ExerciseCard
            key={e.exerciseId}
            entry={e}
            exercise={exMap[e.exerciseId]}
            done={done}
            prev={lastEntryFor(history, e.exerciseId, session.date)}
            onUpdate={(ne) => updateEntry(e.exerciseId, ne)}
            onRemove={() => removeEntry(e.exerciseId)}
          />
        ))}
      </View>

      <Pressable
        onPress={finish}
        style={{
          marginTop: 20,
          paddingVertical: 15,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: COLORS.danger,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Icon name="stop" size={16} color={COLORS.danger} />
        <AppText style={{ color: COLORS.danger, fontSize: 15, fontWeight: '800' }}>Training beenden</AppText>
      </Pressable>

      <ExercisePickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        exercises={exercises}
        onConfirm={addExercises}
        title="Übung hinzufügen"
        planExerciseIds={plan ? plan.exerciseIds : null}
        preselected={[]}
      />
    </ScrollView>
  );
}

const statBox = {
  flex: 1,
  backgroundColor: COLORS.surface,
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: 14,
  paddingVertical: 11,
  paddingHorizontal: 13,
} as const;
const statLbl = {
  fontSize: 9.5,
  fontWeight: '700' as const,
  letterSpacing: 0.6,
  color: COLORS.muted,
  textTransform: 'uppercase' as const,
};
const statValRow = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginTop: 3 };
const statValText: TextStyle = {
  fontSize: 16,
  fontWeight: '800',
  color: COLORS.text,
  fontVariant: ['tabular-nums'],
};
