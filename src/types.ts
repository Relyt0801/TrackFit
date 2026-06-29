// types.ts — domain model (mirrors the prototype's data.jsx shape so screens map cleanly).

export type MetricKey =
  | 'weight'
  | 'reps'
  | 'level'
  | 'duration'
  | 'distance'
  | 'incline';

export interface MetricDef {
  label: string;
  short: string;
  unit: string;
  step: number;
  dec: number;
}

export type ExerciseType = 'strength' | 'cardio';

export interface Exercise {
  id: string;
  name: string;
  equipment: string;
  type: ExerciseType;
  metrics: MetricKey[];
  muscles: string[];
}

export interface Plan {
  id: string;
  name: string;
  exerciseIds: string[];
}

// A logged/in-progress set. Metric values are numbers; '' while a field is being edited.
export interface SetEntry {
  done?: boolean;
  weight?: number | '';
  reps?: number | '';
  level?: number | '';
  duration?: number | '';
  distance?: number | '';
  incline?: number | '';
}

export interface SessionEntry {
  exerciseId: string;
  sets: SetEntry[];
}

export interface Session {
  id: string;
  date: string; // YYYY-MM-DD
  planId: string | null;
  startedAt: string; // ISO
  durationSec?: number;
  entries: SessionEntry[];
}

export interface WeightLog {
  date: string;
  value: number;
}

export interface Profile {
  name: string;
  weightLog: WeightLog[];
  height: number;
  unit: string;
  goalWeight: number;
}

export interface AppState {
  profile: Profile;
  exercises: Exercise[];
  plans: Plan[];
  history: Session[];
  session: Session | null;
}

export interface Muscle {
  name: string;
  hue: number;
}

export interface SeriesPoint {
  date: string;
  value: number;
}
