// App.tsx — root shell: load Manrope, provide the store, host the three tabs + tab bar
// + toast. The prototype's device frame, Stage scaler and tweaks panel are intentionally
// dropped; the app renders full-screen using safe-area insets.
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { COLORS } from './src/theme';
import { StoreProvider, useStore, FinishSummary } from './src/store/store';
import { TabBar, TabId } from './src/components/TabBar';
import { Toast } from './src/components/Toast';
import { TrainingTab } from './src/screens/TrainingTab';
import { StatsTab } from './src/screens/StatsTab';
import { SettingsTab } from './src/screens/SettingsTab';

// Keep the native splash up until fonts + persisted state are ready (no blank flash).
SplashScreen.preventAutoHideAsync().catch(() => {});

function Screens() {
  const { hydrated } = useStore();

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);
  const [tab, setTab] = useState<TabId>('training');
  const [toast, setToast] = useState<string | null>(null);
  const [focusEx, setFocusEx] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toastFor = (m: string) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const onFinish = (summary: FinishSummary | null) => {
    setTab('stats');
    if (summary) {
      setFocusEx(summary.exIds[0]);
      toastFor(`Training gespeichert · ${summary.count} Übung${summary.count > 1 ? 'en' : ''}`);
    } else {
      toastFor('Training beendet');
    }
  };

  if (!hydrated) return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;

  const tabs: TabId[] = ['training', 'stats', 'settings'];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ flex: 1 }}>
        {tabs.map((id) => (
          <View key={id} style={[StyleSheet.absoluteFill, { display: tab === id ? 'flex' : 'none' }]}>
            {id === 'training' && <TrainingTab onFinish={onFinish} />}
            {id === 'stats' && <StatsTab focusEx={focusEx} setFocusEx={setFocusEx} />}
            {id === 'settings' && <SettingsTab />}
          </View>
        ))}
      </View>
      <Toast msg={toast} />
      <TabBar tab={tab} setTab={setTab} />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <StoreProvider>
        {fontsLoaded ? <Screens /> : <View style={{ flex: 1, backgroundColor: COLORS.bg }} />}
      </StoreProvider>
    </SafeAreaProvider>
  );
}
