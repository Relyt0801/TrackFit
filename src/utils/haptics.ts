// haptics.ts — thin wrapper around expo-haptics. All calls are fire-and-forget and
// swallow errors so haptics never block UI (e.g. on web or unsupported devices).
import * as Haptics from 'expo-haptics';

const safe = (p: Promise<void>) => {
  p.catch(() => {});
};

/** Light tap — minor confirmations (timer presets, secondary toggles). */
export const tapLight = () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));

/** Medium tap — primary actions (start session, add set). */
export const tapMedium = () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));

/** Selection change — tab switches, segmented/chips. */
export const selection = () => safe(Haptics.selectionAsync());

/** Success notification — set completed, workout finished. */
export const success = () =>
  safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));

/** Warning notification — rest timer expired (user may not be looking at the screen). */
export const warning = () =>
  safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
