# TrackFit

Mobile-first Gym-Workout-Tracker (deutsche UI) — gebaut mit **Expo / React Native + TypeScript**
nach der Design-Vorlage `design_handoff_trackfit`.

Du startest ein Training (frei oder aus einem Plan), loggst Sätze pro Übung mit Gewicht/Wdh
(oder Cardio-Metriken), pausierst mit dem eingebauten Rest-Timer und prüfst danach pro Übung
deinen Fortschritt in Diagrammen. Pläne, Übungen und Profil verwaltest du in den Einstellungen.
Alle Daten werden lokal auf dem Gerät gespeichert (AsyncStorage, kein Backend).

## Tabs

1. **Training** – Session starten, Sätze live loggen, Rest-Timer, beenden.
2. **Übersicht** – kompakter Fortschritt aller Übungen (letzte Einheit + Veränderung).
3. **Diagramme** – Fortschritts-Charts pro Übung + Bestwerte.
4. **Einstellungen** – Trainingspläne, Übungs-Bibliothek, Daten zurücksetzen.

> **Neu im Projekt?** Starte mit [UEBERGABE.md](UEBERGABE.md) – Zugänge, Einrichtung und
> Arbeiten mit Claude Code.

## Stack

- **Expo SDK 56** / React Native 0.85 / React 19
- **TypeScript** (strict)
- **react-native-svg** – Icons & Diagramme
- **@react-native-async-storage/async-storage** – lokale Persistenz
- **@expo-google-fonts/manrope** – Schriftart Manrope
- **react-native-safe-area-context** – Safe-Area-Insets
- **expo-haptics** – haptisches Feedback
- **expo-keep-awake** – Display bleibt im Training an
- **expo-splash-screen** – sauberer Start ohne Flackern
- **expo-updates** – Online-Updates (EAS Update) ohne App-Store

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

## Updates & Installation auf den Handys

- **Normal:** `npm run update` → alle installierten Apps holen sich das Update beim nächsten
  Start (EAS Update, ohne Store). Ablauf & wann ein neuer Build nötig ist: [ABLAUFPLAN.md](ABLAUFPLAN.md)
- **Notfall (Online-Weg geht nicht):** Installation per **USB-C & PowerShell** mit
  `scripts\USB-Installieren.cmd` bzw. lokaler Build mit `scripts\APK-lokal-bauen.cmd` —
  Anleitung: [USB-INSTALLATION.md](USB-INSTALLATION.md)

## Projektstruktur

```
TrackFit/
├── App.tsx                     # Root: Fonts, Store, Tabs, Tab-Bar, Toast, OTA-Update-Check
├── index.ts                    # Expo-Entry (registerRootComponent)
├── app.json                    # Expo-Konfiguration (Dark-Theme, EAS Update, Paketname)
├── eas.json                    # EAS-Build-Profile (preview = APK) + Update-Channels
├── CLAUDE.md                   # Projektregeln für Claude Code
├── UEBERGABE.md                # Einstieg für neue Mitarbeitende
├── ABLAUFPLAN.md               # Verteilung ohne Store + Online-Updates
├── USB-INSTALLATION.md         # Notfall-Installation per USB-C & PowerShell
├── scripts/                    # usb-install.ps1, build-apk-local.ps1 (+ Doppelklick-.cmd)
├── assets/                     # App-Icon, Splash, svg/ (Marken-Glyphen)
└── src/
    ├── theme.ts                # Design-Tokens (Farben, Radien, Font-Mapping)
    ├── types.ts                # Domänen-Typen
    ├── data/
    │   ├── constants.ts        # MUSCLES, EQUIPMENT, METRICS
    │   ├── color.ts            # OKLCH→sRGB + muscleColor()
    │   ├── helpers.ts          # uid, Datum, epley1RM, seriesFor, …
    │   └── seed.ts             # Start-Übungen, Pläne, 8-Wochen-Verlauf
    ├── store/store.tsx         # StoreProvider (AsyncStorage, Schlüssel trackfit_v2)
    ├── components/             # Icon, ExerciseIcon, Text/TextInput, ui-Primitives, charts, TabBar, Toast
    ├── forms/ExerciseForms.tsx # Übungs-Picker & -Editor (Bottom-Sheets)
    ├── screens/                # TrainingTab, OverviewTab, StatsTab, SettingsTab
    └── utils/                  # haptics, updates (OTA-Update beim Start)
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
