// ExerciseForms.tsx — ExercisePickerSheet (search + equipment/muscle filter + multi-select)
// and ExerciseEditorSheet (create/edit an exercise).
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { COLORS, RADIUS } from '../theme';
import { EQUIPMENT, METRICS, MUSCLES } from '../data/constants';
import { muscleColor } from '../data/color';
import { uid } from '../data/helpers';
import { useStore } from '../store/store';
import { Exercise, ExerciseType, MetricKey } from '../types';
import { Icon } from '../components/Icon';
import { AppText, AppTextInput } from '../components/Text';
import {
  Checkbox,
  Chip,
  EmptyState,
  ExerciseThumb,
  Field,
  IconBtn,
  MuscleTag,
  PrimaryButton,
  Segmented,
  Sheet,
  labelStyle,
} from '../components/ui';

export function ExercisePickerSheet({
  open,
  onClose,
  exercises,
  onConfirm,
  preselected = [],
  title = 'Übungen auswählen',
  planExerciseIds = null,
}: {
  open: boolean;
  onClose: () => void;
  exercises: Exercise[];
  onConfirm: (ids: string[]) => void;
  preselected?: string[];
  title?: string;
  planExerciseIds?: string[] | null;
}) {
  const store = useStore();
  const [q, setQ] = useState('');
  const [equip, setEquip] = useState('Alle');
  const [muscle, setMuscle] = useState<string | null>(null);
  const [showMuscles, setShowMuscles] = useState(false);
  const [onlyPlan, setOnlyPlan] = useState(!!planExerciseIds);
  const [sel, setSel] = useState<string[]>(preselected);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setSel(preselected);
      setOnlyPlan(!!planExerciseIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const list = exercises.filter((e) => {
    if (onlyPlan && planExerciseIds && !planExerciseIds.includes(e.id)) return false;
    if (equip !== 'Alle' && e.equipment !== equip) return false;
    if (muscle && !e.muscles.includes(muscle)) return false;
    if (q.trim() && !e.name.toLowerCase().includes(q.toLowerCase().trim())) return false;
    return true;
  });

  const toggle = (id: string) =>
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const usedMuscles = Object.keys(MUSCLES);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      full
      footer={
        <PrimaryButton
          disabled={!sel.length}
          onPress={() => onConfirm(sel)}
          label={
            sel.length
              ? `${sel.length} Übung${sel.length > 1 ? 'en' : ''} hinzufügen`
              : 'Übungen auswählen'
          }
        />
      }
    >
      {/* search */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: COLORS.surface2,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 12,
          paddingHorizontal: 12,
          marginBottom: 12,
        }}
      >
        <Icon name="search" size={18} color={COLORS.muted} />
        <AppTextInput
          value={q}
          onChangeText={setQ}
          placeholder="Übungen suchen…"
          placeholderTextColor="rgba(243,245,248,0.26)"
          style={{ flex: 1, fontSize: 15, paddingVertical: 11 }}
        />
        {q ? <IconBtn name="x" size={16} onPress={() => setQ('')} /> : null}
      </View>

      {/* equipment filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 7, paddingBottom: 9 }}
      >
        {planExerciseIds ? (
          <Chip active={onlyPlan} onPress={() => setOnlyPlan((v) => !v)}>
            ★ Aus Plan
          </Chip>
        ) : null}
        {['Alle', ...EQUIPMENT].map((eq) => (
          <Chip key={eq} active={equip === eq} onPress={() => setEquip(eq)}>
            {eq}
          </Chip>
        ))}
      </ScrollView>

      {/* muscle filter toggle */}
      <View style={{ marginBottom: 10 }}>
        <Pressable
          onPress={() => setShowMuscles((v) => !v)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 }}
        >
          <Icon name="filter" size={15} color={muscle ? COLORS.accent : COLORS.muted} />
          <AppText style={{ fontSize: 12.5, fontWeight: '700', color: muscle ? COLORS.accent : COLORS.muted }}>
            {muscle ? `Muskel: ${MUSCLES[muscle].name}` : 'Nach Muskelgruppe filtern'}
          </AppText>
          <Icon name={showMuscles ? 'chevD' : 'chevR'} size={14} color={muscle ? COLORS.accent : COLORS.muted} />
          {muscle ? (
            <Pressable onPress={() => setMuscle(null)} hitSlop={8} style={{ marginLeft: 2 }}>
              <Icon name="x" size={13} color={COLORS.accent} />
            </Pressable>
          ) : null}
        </Pressable>
        {showMuscles ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {usedMuscles.map((mk) => {
              const on = muscle === mk;
              return (
                <Pressable
                  key={mk}
                  onPress={() => setMuscle(on ? null : mk)}
                  style={{
                    paddingVertical: 4,
                    paddingHorizontal: 9,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: on ? muscleColor(mk, 0.6, 0.12) : COLORS.border,
                    backgroundColor: on ? muscleColor(mk, 0.32, 0.08) : 'transparent',
                  }}
                >
                  <AppText
                    style={{
                      fontSize: 11.5,
                      fontWeight: '600',
                      color: on ? muscleColor(mk, 0.82, 0.14) : COLORS.muted,
                    }}
                  >
                    {MUSCLES[mk].name}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      {/* create new */}
      <Pressable
        onPress={() => setEditorOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 12,
          paddingHorizontal: 14,
          marginBottom: 10,
          backgroundColor: COLORS.surface2,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: COLORS.border,
          borderRadius: RADIUS,
        }}
      >
        <Icon name="plus" size={18} color={COLORS.accent} />
        <AppText style={{ color: COLORS.accent, fontSize: 14, fontWeight: '700' }}>Neue Übung erstellen</AppText>
      </Pressable>

      {/* list */}
      <View style={{ gap: 8, paddingBottom: 8 }}>
        {list.length === 0 ? (
          <EmptyState
            icon="search"
            title="Keine Übung gefunden"
            sub="Passe Suche/Filter an oder erstelle eine neue Übung."
          />
        ) : null}
        {list.map((e) => {
          const on = sel.includes(e.id);
          return (
            <Pressable
              key={e.id}
              onPress={() => toggle(e.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 10,
                borderRadius: RADIUS,
                borderWidth: 1,
                borderColor: on ? COLORS.accent : COLORS.border,
                backgroundColor: on ? COLORS.accentTint : COLORS.surface2,
              }}
            >
              <View style={{ width: 54, height: 54 }}>
                <ExerciseThumb h={54} label="" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText style={{ fontSize: 14.5, fontWeight: '700', color: COLORS.text }}>{e.name}</AppText>
                <AppText style={{ fontSize: 11.5, color: COLORS.muted, fontWeight: '600', marginTop: 2, marginBottom: 5 }}>
                  {e.equipment}
                </AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                  {e.muscles.slice(0, 3).map((m) => (
                    <MuscleTag key={m} m={m} small />
                  ))}
                </View>
              </View>
              <Checkbox checked={on} onChange={() => toggle(e.id)} size={24} />
            </Pressable>
          );
        })}
      </View>

      <ExerciseEditorSheet
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={(ex) => {
          store.addExercise(ex);
          setEditorOpen(false);
          setSel((s) => [...s, ex.id]);
        }}
      />
    </Sheet>
  );
}

export function ExerciseEditorSheet({
  open,
  onClose,
  onSave,
  onDelete,
  initial = null,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (ex: Exercise) => void;
  onDelete?: (id: string) => void;
  initial?: Exercise | null;
}) {
  const blank: Exercise = {
    id: '',
    name: '',
    equipment: 'Langhantel',
    type: 'strength',
    metrics: ['weight', 'reps'],
    muscles: [],
  };
  const [d, setD] = useState<Exercise>(initial || blank);

  useEffect(() => {
    if (open) setD(initial || blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (patch: Partial<Exercise>) => setD((p) => ({ ...p, ...patch }));
  const toggleMuscle = (mk: string) =>
    setD((p) => ({
      ...p,
      muscles: p.muscles.includes(mk) ? p.muscles.filter((x) => x !== mk) : [...p.muscles, mk],
    }));
  const toggleMetric = (mk: MetricKey) =>
    setD((p) => ({
      ...p,
      metrics: p.metrics.includes(mk) ? p.metrics.filter((x) => x !== mk) : [...p.metrics, mk],
    }));
  const setType = (t: ExerciseType) =>
    set({ type: t, metrics: t === 'cardio' ? ['level', 'duration', 'distance'] : ['weight', 'reps'] });

  const valid = !!d.name.trim() && d.metrics.length > 0 && d.muscles.length > 0;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={initial ? 'Übung bearbeiten' : 'Neue Übung'}
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {initial && onDelete ? (
            <Pressable
              onPress={() => {
                onDelete(initial.id);
                onClose();
              }}
              style={{
                paddingVertical: 15,
                paddingHorizontal: 18,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: COLORS.danger,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="trash" size={17} color={COLORS.danger} />
            </Pressable>
          ) : null}
          <PrimaryButton
            disabled={!valid}
            onPress={() => onSave({ ...d, name: d.name.trim(), id: initial ? initial.id : uid('ex') })}
            label="Speichern"
            style={{ flex: 1 }}
          />
        </View>
      }
    >
      <View style={{ gap: 16, paddingBottom: 16 }}>
        <Field label="Name" value={d.name} onChange={(v) => set({ name: v })} placeholder="z. B. Langhantel-Bankdrücken" />
        <View>
          <AppText style={labelStyle}>Typ</AppText>
          <Segmented
            options={[
              { value: 'strength', label: 'Kraft' },
              { value: 'cardio', label: 'Cardio' },
            ]}
            value={d.type}
            onChange={setType}
          />
        </View>
        <View>
          <AppText style={labelStyle}>Equipment</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            {EQUIPMENT.map((eq) => (
              <Chip key={eq} active={d.equipment === eq} onPress={() => set({ equipment: eq })}>
                {eq}
              </Chip>
            ))}
          </View>
        </View>
        <View>
          <AppText style={labelStyle}>Messwerte (werden im Training & Diagramm erfasst)</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            {(Object.keys(METRICS) as MetricKey[]).map((mk) => (
              <Chip key={mk} active={d.metrics.includes(mk)} onPress={() => toggleMetric(mk)}>
                {METRICS[mk].label}
              </Chip>
            ))}
          </View>
        </View>
        <View>
          <AppText style={labelStyle}>Angesprochene Muskelgruppen</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {Object.keys(MUSCLES).map((mk) => {
              const on = d.muscles.includes(mk);
              return (
                <Pressable
                  key={mk}
                  onPress={() => toggleMuscle(mk)}
                  style={{
                    paddingVertical: 5,
                    paddingHorizontal: 10,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: on ? muscleColor(mk, 0.6, 0.12) : COLORS.border,
                    backgroundColor: on ? muscleColor(mk, 0.32, 0.08) : 'transparent',
                  }}
                >
                  <AppText style={{ fontSize: 12, fontWeight: '600', color: on ? muscleColor(mk, 0.82, 0.14) : COLORS.muted }}>
                    {MUSCLES[mk].name}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Sheet>
  );
}
