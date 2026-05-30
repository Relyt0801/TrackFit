// store.tsx — persistent app store backed by AsyncStorage (replaces the prototype's
// localStorage StoreProvider). Same data shape so screens map over cleanly.
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AppState,
  Exercise,
  Plan,
  Profile,
  Session,
} from '../types';
import { defaultState } from '../data/seed';

const STORE_KEY = 'trackfit_v2';

interface FinishSummary {
  count: number;
  exIds: string[];
}

interface StoreApi {
  state: AppState;
  hydrated: boolean;
  resetAll: () => void;
  addExercise: (ex: Exercise) => void;
  updateExercise: (id: string, patch: Partial<Exercise>) => void;
  deleteExercise: (id: string) => void;
  addPlan: (pl: Plan) => void;
  updatePlan: (id: string, patch: Partial<Plan>) => void;
  deletePlan: (id: string) => void;
  setSession: (s: Session | null | ((prev: Session | null) => Session | null)) => void;
  setProfile: (patch: Partial<Profile>) => void;
  pushHistory: (sess: Session) => void;
}

const StoreCtx = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);

  // Load persisted state once on mount.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AppState>;
          setState({ ...defaultState(), ...parsed });
        }
      } catch {
        // fall back to default state
      } finally {
        hydratedRef.current = true;
        setHydrated(true);
      }
    })();
  }, []);

  // Persist on change (skip until after hydration so we don't clobber stored data).
  useEffect(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(STORE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const api = useMemo<StoreApi>(
    () => ({
      state,
      hydrated,
      resetAll: () => setState(defaultState()),
      addExercise: (ex) =>
        setState((p) => ({ ...p, exercises: [...p.exercises, ex] })),
      updateExercise: (id, patch) =>
        setState((p) => ({
          ...p,
          exercises: p.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),
      deleteExercise: (id) =>
        setState((p) => ({
          ...p,
          exercises: p.exercises.filter((e) => e.id !== id),
        })),
      addPlan: (pl) => setState((p) => ({ ...p, plans: [...p.plans, pl] })),
      updatePlan: (id, patch) =>
        setState((p) => ({
          ...p,
          plans: p.plans.map((pl) => (pl.id === id ? { ...pl, ...patch } : pl)),
        })),
      deletePlan: (id) =>
        setState((p) => ({ ...p, plans: p.plans.filter((pl) => pl.id !== id) })),
      setSession: (s) =>
        setState((p) => ({
          ...p,
          session: typeof s === 'function' ? (s as (prev: Session | null) => Session | null)(p.session) : s,
        })),
      setProfile: (patch) =>
        setState((p) => ({ ...p, profile: { ...p.profile, ...patch } })),
      pushHistory: (sess) =>
        setState((p) => ({ ...p, history: [...p.history, sess] })),
    }),
    [state, hydrated],
  );

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
}

export type { FinishSummary };
