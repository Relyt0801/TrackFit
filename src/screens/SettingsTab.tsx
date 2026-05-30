// SettingsTab.tsx — training plans, exercise management, data reset.
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS } from '../theme';
import { uid } from '../data/helpers';
import { useStore } from '../store/store';
import { Exercise, Plan } from '../types';
import { Icon } from '../components/Icon';
import { AppText, AppTextInput } from '../components/Text';
import {
  EmptyState,
  ExerciseThumb,
  Field,
  IconBtn,
  MuscleTag,
  PrimaryButton,
  Sheet,
} from '../components/ui';
import { SessionHeaderTitle } from '../components/SessionHeaderTitle';
import { ExerciseEditorSheet, ExercisePickerSheet } from '../forms/ExerciseForms';

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 22 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginHorizontal: 2,
          marginBottom: 10,
        }}
      >
        <AppText style={{ fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6, color: COLORS.muted, textTransform: 'uppercase' }}>
          {title}
        </AppText>
        {action}
      </View>
      {children}
    </View>
  );
}

const cardStyle = {
  backgroundColor: COLORS.surface,
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: RADIUS,
} as const;

function AddBtn({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Icon name="plus" size={15} color={COLORS.accent} />
      <AppText style={{ color: COLORS.accent, fontSize: 12.5, fontWeight: '800' }}>{label}</AppText>
    </Pressable>
  );
}

function PlanEditorSheet({
  open,
  onClose,
  plan,
  exercises,
}: {
  open: boolean;
  onClose: () => void;
  plan: Plan | null;
  exercises: Exercise[];
}) {
  const store = useStore();
  const isNew = !plan;
  const [name, setName] = useState('');
  const [ids, setIds] = useState<string[]>([]);
  const [pickOpen, setPickOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setName(plan ? plan.name : '');
      setIds(plan ? [...plan.exerciseIds] : []);
    }
  }, [open, plan]);

  const exMap = Object.fromEntries(exercises.map((e) => [e.id, e]));
  const save = () => {
    if (isNew) store.addPlan({ id: uid('plan'), name: name.trim() || 'Neuer Plan', exerciseIds: ids });
    else if (plan) store.updatePlan(plan.id, { name: name.trim() || plan.name, exerciseIds: ids });
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isNew ? 'Neuer Trainingsplan' : 'Plan bearbeiten'}
      full
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {!isNew && plan ? (
            <Pressable
              onPress={() => {
                store.deletePlan(plan.id);
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
          <PrimaryButton onPress={save} label="Speichern" style={{ flex: 1 }} />
        </View>
      }
    >
      <View style={{ marginBottom: 16 }}>
        <Field label="Plan-Name" value={name} onChange={setName} placeholder="z. B. Oberkörper A" />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <AppText style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: COLORS.muted, textTransform: 'uppercase' }}>
          Übungen ({ids.length})
        </AppText>
        <AddBtn onPress={() => setPickOpen(true)} label="Hinzufügen" />
      </View>
      <View style={{ gap: 7, paddingBottom: 8 }}>
        {ids.length === 0 ? (
          <EmptyState icon="dumbbell" title="Noch keine Übungen" sub="Füge Übungen zu diesem Plan hinzu." />
        ) : null}
        {ids.map((id) =>
          exMap[id] ? (
            <View
              key={id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 11,
                padding: 11,
                borderRadius: RADIUS,
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.surface2,
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>{exMap[id].name}</AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {exMap[id].muscles.slice(0, 3).map((m) => (
                    <MuscleTag key={m} m={m} small />
                  ))}
                </View>
              </View>
              <IconBtn name="x" onPress={() => setIds(ids.filter((x) => x !== id))} bg={COLORS.surface} />
            </View>
          ) : null,
        )}
      </View>
      <ExercisePickerSheet
        open={pickOpen}
        onClose={() => setPickOpen(false)}
        exercises={exercises}
        preselected={ids}
        onConfirm={(sel) => {
          setIds(sel);
          setPickOpen(false);
        }}
        title="Übungen für Plan"
      />
    </Sheet>
  );
}

export function SettingsTab() {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const { plans, exercises } = store.state;
  const [planEdit, setPlanEdit] = useState<Plan | null | undefined>(undefined); // undefined=closed
  const [exEdit, setExEdit] = useState<Exercise | null | undefined>(undefined);
  const [exQuery, setExQuery] = useState('');
  const exList = exercises.filter(
    (e) => !exQuery.trim() || e.name.toLowerCase().includes(exQuery.toLowerCase().trim()),
  );

  const confirmReset = () => {
    Alert.alert('Alle Daten zurücksetzen', 'Übungen, Pläne, Verlauf und Profil werden zurückgesetzt.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Zurücksetzen', style: 'destructive', onPress: () => store.resetAll() },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 28 }}
      showsVerticalScrollIndicator={false}
    >
      <SessionHeaderTitle title="Einstellungen" />

      <Section title="Trainingspläne" action={<AddBtn onPress={() => setPlanEdit(null)} label="Neuer Plan" />}>
        <View style={{ gap: 9 }}>
          {plans.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => setPlanEdit(p)}
              style={[cardStyle, { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13 }]}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 11,
                  backgroundColor: COLORS.accentTint,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="list" size={19} color={COLORS.accent} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText style={{ fontSize: 14.5, fontWeight: '800', color: COLORS.text }}>{p.name}</AppText>
                <AppText style={{ fontSize: 12, color: COLORS.muted, fontWeight: '600', marginTop: 1 }}>
                  {p.exerciseIds.length} Übungen
                </AppText>
              </View>
              <Icon name="edit" size={17} color={COLORS.muted} />
            </Pressable>
          ))}
          {plans.length === 0 ? <EmptyState icon="list" title="Keine Pläne" sub="Erstelle deinen ersten Trainingsplan." /> : null}
        </View>
      </Section>

      <Section title={`Übungen (${exercises.length})`} action={<AddBtn onPress={() => setExEdit(null)} label="Neue Übung" />}>
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
            marginBottom: 10,
          }}
        >
          <Icon name="search" size={17} color={COLORS.muted} />
          <AppTextInput
            value={exQuery}
            onChangeText={setExQuery}
            placeholder="Übungen durchsuchen…"
            placeholderTextColor="rgba(243,245,248,0.26)"
            style={{ flex: 1, fontSize: 14, paddingVertical: 10 }}
          />
        </View>
        <View style={{ gap: 8 }}>
          {exList.map((e) => (
            <Pressable
              key={e.id}
              onPress={() => setExEdit(e)}
              style={[cardStyle, { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 11 }]}
            >
              <View style={{ width: 46, height: 46 }}>
                <ExerciseThumb h={46} label="" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>{e.name}</AppText>
                <AppText style={{ fontSize: 11.5, color: COLORS.muted, fontWeight: '600', marginTop: 2, marginBottom: 4 }}>
                  {e.equipment} · {e.type === 'cardio' ? 'Cardio' : 'Kraft'}
                </AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                  {e.muscles.slice(0, 3).map((m) => (
                    <MuscleTag key={m} m={m} small />
                  ))}
                </View>
              </View>
              <Icon name="edit" size={16} color={COLORS.muted} />
            </Pressable>
          ))}
        </View>
      </Section>

      <Pressable
        onPress={confirmReset}
        style={{
          paddingVertical: 13,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: COLORS.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
        }}
      >
        <Icon name="trash" size={16} color={COLORS.danger} />
        <AppText style={{ color: COLORS.danger, fontSize: 13.5, fontWeight: '700' }}>Alle Daten zurücksetzen</AppText>
      </Pressable>
      <AppText style={{ textAlign: 'center', fontSize: 11, color: COLORS.muted, fontWeight: '600', marginTop: 14 }}>
        TrackFit · Fortschritt wird automatisch gespeichert
      </AppText>

      <PlanEditorSheet
        open={planEdit !== undefined}
        onClose={() => setPlanEdit(undefined)}
        plan={planEdit || null}
        exercises={exercises}
      />
      <ExerciseEditorSheet
        open={exEdit !== undefined}
        onClose={() => setExEdit(undefined)}
        initial={exEdit || null}
        onDelete={(id) => store.deleteExercise(id)}
        onSave={(ex) => {
          if (exEdit) store.updateExercise(ex.id, ex);
          else store.addExercise(ex);
          setExEdit(undefined);
        }}
      />
    </ScrollView>
  );
}
