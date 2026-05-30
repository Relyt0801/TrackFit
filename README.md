# TrackFit

Mobile-first Gym-Workout-Tracker (deutsche UI) — gebaut mit **Expo / React Native + TypeScript**
nach der Design-Vorlage `design_handoff_trackfit`.

Du startest ein Training (frei oder aus einem Plan), loggst Sätze pro Übung mit Gewicht/Wdh
(oder Cardio-Metriken), pausierst mit dem eingebauten Rest-Timer und prüfst danach pro Übung
deinen Fortschritt in Diagrammen. Pläne, Übungen und Profil verwaltest du in den Einstellungen.
Alle Daten werden lokal auf dem Gerät gespeichert (AsyncStorage, kein Backend).

## Tabs

1. **Training** – Session starten, Sätze live loggen, Rest-Timer, beenden.
2. **Diagramme** – Fortschritts-Charts pro Übung + Bestwerte.
3. **Einstellungen** – Trainingspläne, Übungs-Bibliothek, Daten zurücksetzen.

## Stack

- **Expo SDK 51** / React Native 0.74 / React 18
- **TypeScript** (strict)
- **react-native-svg** – Icons & Diagramme
- **@react-native-async-storage/async-storage** – lokale Persistenz
- **@expo-google-fonts/manrope** – Schriftart Manrope
- **react-native-safe-area-context** – Safe-Area-Insets
- **expo-haptics** – haptisches Feedback
- **expo-keep-awake** – Display bleibt im Training an
- **expo-splash-screen** – sauberer Start ohne Flackern

## UX-Feinschliff

- **Haptik:** Erfolgs-Vibration beim Abhaken eines Satzes und beim Beenden, leichte
  Ticks bei Timer/Tab-Wechsel, Warn-Vibration wenn die Pause vorbei ist.
- **Smarter Rest-Timer:** startet automatisch nach jedem erledigten Satz (90 s),
  lässt sich mit −15 s / +30 s anpassen, vibriert beim Ablauf (Phone in der Tasche).
- **Display bleibt an** während eines laufenden Trainings.
- **Tastatur-UX:** Stepper-Buttons bleiben bei offener Tastatur tippbar
  (`keyboardShouldPersistTaps`), Zahlenfeld markiert beim Fokus, „Fertig"-Taste,
  Tastatur schließt beim Scrollen.
- **Press-Feedback** auf allen Buttons, Chips, Karten und Tabs.
- **Barrierefreiheit:** `accessibilityRole`/`-Label`/`-State` für Tabs, Checkboxen,
  Icon-Buttons und Stepper (Screenreader-tauglich).
- **Splash-Screen** bleibt sichtbar, bis Schriften und gespeicherte Daten geladen sind.

## Setup & Start

```bash
npm install
npm start          # Expo Dev Server (QR-Code für Expo Go)
# oder direkt auf ein Ziel:
npm run ios        # iOS-Simulator
npm run android    # Android-Emulator
npm run web        # Browser
```

App in **Expo Go** (iOS/Android) öffnen, indem du den QR-Code scannst.

## Projektstruktur

```
TrackFit/
├── App.tsx                     # Root: Fonts, Store, Tabs, Tab-Bar, Toast
├── index.ts                    # Expo-Entry (registerRootComponent)
├── app.json                    # Expo-Konfiguration (Dark-Theme)
└── src/
    ├── theme.ts                # Design-Tokens (Farben, Radien, Font-Mapping)
    ├── types.ts                # Domänen-Typen
    ├── data/
    │   ├── constants.ts        # MUSCLES, EQUIPMENT, METRICS
    │   ├── color.ts            # OKLCH→sRGB + muscleColor()
    │   ├── helpers.ts          # uid, Datum, epley1RM, seriesFor, …
    │   └── seed.ts             # Start-Übungen, Pläne, 8-Wochen-Verlauf
    ├── store/store.tsx         # StoreProvider (AsyncStorage)
    ├── components/             # Icon, Text/TextInput, ui-Primitives, charts, TabBar, Toast
    ├── forms/ExerciseForms.tsx # Übungs-Picker & -Editor (Bottom-Sheets)
    └── screens/                # TrainingTab, StatsTab, SettingsTab
```

## Design-Tokens

Dark-Theme, Orange-Akzent (`#ff8a3d`), Schrift **Manrope**, „Weich"-Radien (18px).
Die Theming-Spielwiese des Prototyps (Akzent-/Font-/Card-/Dichte-Umschalter) ist bewusst
**nicht** mitausgeliefert — die gewählten Defaults sind als Tokens in `src/theme.ts` fixiert.

## Hinweise zur Portierung

Der Prototyp (HTML/React via In-Browser-Babel) diente als **UI- und Interaktions-Spezifikation**.
Für die echte App wurden ersetzt/entfernt:

- `localStorage` → **AsyncStorage** (`src/store/store.tsx`)
- `oklch()` / `color-mix()` → JS-Konvertierung (`src/data/color.ts`, Tokens in `theme.ts`)
- CSS-Inline-Styles → React-Native-Styles; `Icon`/Charts über **react-native-svg**
- Device-Bezel, `Stage`-Scaler, Tweaks-Panel → entfernt (Prototype-only)
- Dropdown-Menüs / `confirm()` → native `Alert`-Dialoge

Die deutsche UI-Copy wurde wortgetreu übernommen.
