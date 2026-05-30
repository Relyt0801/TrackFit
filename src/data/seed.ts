// seed.ts — starter exercise library, plans, and a plausible 8-week history so charts
// and "last time" placeholders work on first launch.
import { AppState, Exercise, Plan, Session } from '../types';
import { todayKey, uid } from './helpers';

export const SEED_EXERCISES: Exercise[] = [
  { id: 'ex_bankdruecken', name: 'Langhantel-Bankdrücken', equipment: 'Langhantel', type: 'strength', metrics: ['weight', 'reps'], muscles: ['brust', 'trizeps', 'schultern'] },
  { id: 'ex_schraegbank', name: 'Schrägbank-Kurzhantel', equipment: 'Kurzhantel', type: 'strength', metrics: ['weight', 'reps'], muscles: ['brust', 'schultern', 'trizeps'] },
  { id: 'ex_schulterdruecken', name: 'Schulterdrücken mit Kurzhanteln', equipment: 'Kurzhantel', type: 'strength', metrics: ['weight', 'reps'], muscles: ['schultern', 'trizeps'] },
  { id: 'ex_seitheben', name: 'Seitheben', equipment: 'Kurzhantel', type: 'strength', metrics: ['weight', 'reps'], muscles: ['schultern'] },
  { id: 'ex_klimmzug', name: 'Klimmzüge', equipment: 'Körpergewicht', type: 'strength', metrics: ['weight', 'reps'], muscles: ['oberer_ruecken', 'bizeps'] },
  { id: 'ex_latzug', name: 'Latzug', equipment: 'Kabelzug', type: 'strength', metrics: ['weight', 'reps'], muscles: ['oberer_ruecken', 'bizeps'] },
  { id: 'ex_rudern_kabel', name: 'Rudern am Kabel', equipment: 'Kabelzug', type: 'strength', metrics: ['weight', 'reps'], muscles: ['oberer_ruecken', 'bizeps', 'unterer_ruecken'] },
  { id: 'ex_bizepscurl', name: 'Langhantel-Bizepscurl', equipment: 'Langhantel', type: 'strength', metrics: ['weight', 'reps'], muscles: ['bizeps', 'unterarme'] },
  { id: 'ex_trizepsdruecken', name: 'Trizepsdrücken am Kabel', equipment: 'Kabelzug', type: 'strength', metrics: ['weight', 'reps'], muscles: ['trizeps'] },
  { id: 'ex_kniebeuge', name: 'Langhantel-Kniebeuge', equipment: 'Langhantel', type: 'strength', metrics: ['weight', 'reps'], muscles: ['quadrizeps', 'gesaess', 'unterer_ruecken'] },
  { id: 'ex_beinpresse', name: 'Beinpresse, unilateral', equipment: 'Maschine', type: 'strength', metrics: ['weight', 'reps'], muscles: ['quadrizeps', 'gesaess'] },
  { id: 'ex_split_squat', name: 'Bulgarian Split Squat', equipment: 'Kurzhantel', type: 'strength', metrics: ['weight', 'reps'], muscles: ['quadrizeps', 'gesaess'] },
  { id: 'ex_beinbeuger', name: 'Beinbeuger liegend', equipment: 'Maschine', type: 'strength', metrics: ['weight', 'reps'], muscles: ['beinbeuger'] },
  { id: 'ex_kreuzheben', name: 'Kreuzheben', equipment: 'Langhantel', type: 'strength', metrics: ['weight', 'reps'], muscles: ['unterer_ruecken', 'beinbeuger', 'gesaess'] },
  { id: 'ex_wadenheben', name: 'Wadenheben stehend', equipment: 'Maschine', type: 'strength', metrics: ['weight', 'reps'], muscles: ['waden'] },
  { id: 'ex_plank', name: 'Unterarmstütz (Plank)', equipment: 'Körpergewicht', type: 'strength', metrics: ['duration'], muscles: ['bauch'] },
  { id: 'ex_crunch', name: 'Bauchpresse Maschine', equipment: 'Maschine', type: 'strength', metrics: ['weight', 'reps'], muscles: ['bauch'] },
  { id: 'ex_laufband', name: 'Laufband', equipment: 'Cardio', type: 'cardio', metrics: ['level', 'incline', 'duration', 'distance'], muscles: ['ausdauer', 'waden'] },
  { id: 'ex_crosstrainer', name: 'Crosstrainer', equipment: 'Cardio', type: 'cardio', metrics: ['level', 'duration', 'distance'], muscles: ['ausdauer'] },
  { id: 'ex_rudergeraet', name: 'Rudergerät', equipment: 'Cardio', type: 'cardio', metrics: ['level', 'duration', 'distance'], muscles: ['ausdauer', 'oberer_ruecken'] },
];

export const SEED_PLANS: Plan[] = [
  { id: 'plan_push', name: 'Push (Brust/Schulter/Trizeps)', exerciseIds: ['ex_bankdruecken', 'ex_schraegbank', 'ex_schulterdruecken', 'ex_seitheben', 'ex_trizepsdruecken'] },
  { id: 'plan_pull', name: 'Pull (Rücken/Bizeps)', exerciseIds: ['ex_klimmzug', 'ex_latzug', 'ex_rudern_kabel', 'ex_bizepscurl'] },
  { id: 'plan_legs', name: 'Beine', exerciseIds: ['ex_kniebeuge', 'ex_beinpresse', 'ex_beinbeuger', 'ex_wadenheben'] },
  { id: 'plan_cardio', name: 'Cardio & Core', exerciseIds: ['ex_laufband', 'ex_rudergeraet', 'ex_plank', 'ex_crunch'] },
];

function makeSeedHistory(): Session[] {
  const hist: Session[] = [];
  const today = new Date();
  const progBank = [60, 62.5, 62.5, 65, 67.5, 67.5, 70, 72.5];
  const progSquat = [80, 82.5, 85, 85, 90, 92.5, 95, 100];
  const progCurl = [25, 25, 27.5, 27.5, 30, 30, 32.5, 32.5];
  const progLat = [50, 52.5, 55, 55, 57.5, 60, 60, 62.5];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i * 5 - 3);
    const wk = 7 - i;
    hist.push({
      id: uid('sess'),
      date: todayKey(d),
      planId: wk % 2 ? 'plan_pull' : 'plan_push',
      startedAt: d.toISOString(),
      durationSec: 3000 + Math.round(Math.random() * 1800),
      entries:
        wk % 2
          ? [
              { exerciseId: 'ex_latzug', sets: [{ weight: progLat[wk], reps: 12 }, { weight: progLat[wk], reps: 11 }, { weight: progLat[wk] - 2.5, reps: 10 }] },
              { exerciseId: 'ex_bizepscurl', sets: [{ weight: progCurl[wk], reps: 12 }, { weight: progCurl[wk], reps: 10 }, { weight: progCurl[wk] - 2.5, reps: 9 }] },
            ]
          : [
              { exerciseId: 'ex_bankdruecken', sets: [{ weight: progBank[wk], reps: 12 }, { weight: progBank[wk], reps: 10 }, { weight: progBank[wk] - 5, reps: 9 }] },
              { exerciseId: 'ex_kniebeuge', sets: [{ weight: progSquat[wk], reps: 10 }, { weight: progSquat[wk], reps: 9 }, { weight: progSquat[wk] - 10, reps: 8 }] },
            ],
    });
  }
  return hist;
}

export function defaultState(): AppState {
  return {
    profile: {
      name: '',
      weightLog: [{ date: todayKey(), value: 80 }],
      height: 180,
      unit: 'kg',
      goalWeight: 78,
    },
    exercises: SEED_EXERCISES,
    plans: SEED_PLANS,
    history: makeSeedHistory(),
    session: null,
  };
}
