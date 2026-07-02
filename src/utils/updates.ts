// updates.ts — over-the-air (OTA) updates via expo-updates / EAS Update.
// On every cold start a built (non-dev) app asks the EAS Update server whether a newer
// JS bundle exists for its channel + runtimeVersion; if so it downloads and reloads into
// it. This lets us ship changes to all installed devices without a new APK or app store —
// only native changes (new packages, SDK bumps, version change, launcher icon / splash
// PNGs baked into the APK) still need a fresh build. In-app SVG icons are plain JS and
// DO ship over-the-air.
import { useEffect } from 'react';
import * as Updates from 'expo-updates';

export async function checkForOtaUpdate(): Promise<boolean> {
  // No update server in Expo Go / dev, and Updates is disabled there → skip quietly.
  if (__DEV__ || !Updates.isEnabled) return false;
  try {
    const res = await Updates.checkForUpdateAsync();
    if (!res.isAvailable) return false;
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync(); // restarts the app into the new bundle
    return true;
  } catch {
    // Offline, or update endpoint not configured yet → run the bundled version as-is.
    return false;
  }
}

// Run the OTA check once on app launch. Safe in dev and Expo Go (it no-ops there).
export function useOtaUpdates(): void {
  useEffect(() => {
    checkForOtaUpdate();
  }, []);
}
