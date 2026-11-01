# TrackFit — Claude Code Configuration

TrackFit is a mobile-first **gym workout tracker** built with **Expo / React Native + TypeScript**.
It is distributed **without an app store** (Android APK built by EAS + over-the-air updates) to a
small group of real users. All data lives **only on the device** (AsyncStorage, no backend).

The team works in **German**: UI copy, docs and commit messages are German. New contributors
start with [`ANLEITUNG.md`](ANLEITUNG.md) (quick start) and [`UEBERGABE.md`](UEBERGABE.md).

## First Contact / Onboarding

If the person is new to the project — the session starts with `/start`, a greeting without a
concrete task, or a message saying they are new / asking for onboarding (the launcher
`Claude-starten.cmd` sends such a message) — follow **`.claude/commands/start.md`**: greet in
German, check the setup, explain the app in a few sentences, then ask **„Was soll an TrackFit
geändert werden?“** and wait. Don't modify files until they have said what they want.

## Quick Facts

| | |
|---|---|
| Stack | Expo SDK 56, React Native 0.85, React 19, TypeScript (strict), react-native-svg, AsyncStorage, Manrope |
| Entry | `index.ts` → `App.tsx` |
| Android package | `com.relyt0801.trackfit` — **never change** |
| EAS project | owner `relyt0801`, projectId in `app.json`, build profile + update channel `preview` |
| Checks | `npm run typecheck` + `npx expo export --platform android --output-dir /tmp/tf-export` (no test suite, no linter, no CI) |

## Commands

```bash
npm install                 # dependencies
npm start                   # Expo dev server (Expo Go via QR code; OTA check is a no-op in dev)
npm run typecheck           # tsc --noEmit
npx expo export --platform android --output-dir /tmp/tf-export   # the bundle `eas update` ships
npm run update              # eas update --branch preview  (needs Expo login, see below)
npm run build:apk           # eas build --platform android --profile preview
```

## Architecture

- `App.tsx` — root: loads Manrope, `StoreProvider`, renders all 4 tabs at once (hidden with
  `display: none` to keep state): **Training**, **Übersicht**, **Diagramme**, **Einstellungen**;
  plus `TabBar`, `Toast` and the OTA check (`useOtaUpdates`).
- `src/store/store.tsx` — single `StoreProvider` / `useStore()`, persisted to AsyncStorage.
- `src/screens/` — `TrainingTab` (sessions, set logging, rest timer), `OverviewTab`, `StatsTab`
  (charts + bests), `SettingsTab` (plans, exercise library, reset all data).
- `src/components/` — `ui.tsx` primitives, `Text.tsx` (Manrope mapping), `Icon`, `ExerciseIcon`
  (brand glyphs), `charts.tsx` (svg), `TabBar`, `Toast`, `SessionHeaderTitle`.
- `src/forms/ExerciseForms.tsx` — exercise picker/editor bottom sheets.
- `src/data/` — `constants` (muscles, equipment, metrics), `color` (OKLCH→sRGB), `helpers`
  (dates, `epley1RM`, `seriesFor`), `seed` (default state).
- `src/types.ts` (domain types), `src/theme.ts` (design tokens), `src/utils/` (`haptics`, `updates`).
- `assets/` — app icon/splash PNGs; `assets/svg/` brand glyphs (see its README).

### Persisted data — protect existing users

Devices hold real training history under the AsyncStorage key **`trackfit_v2`**. On load the
stored object is shallow-merged over `defaultState()`. Therefore:
- **Never rename `STORE_KEY`** or drop/rename stored fields — an OTA update would silently show
  users an empty app.
- New **top-level** fields are fine (they get defaults). Changing the shape of nested data
  (sessions, sets, exercises, plans) needs an explicit migration in `store.tsx` that handles the
  old shape.

## Design System (source of truth: `src/theme.ts`)

Dark theme only. Use the tokens — don't hardcode colors.
- Background `#0c0d11`, surfaces `#16181d` / `#1f222a`, borders `#272a32` / `#363b46`
- Text `#f3f5f8`, muted `#888e9c`
- Accent / CTA orange `#ff8a3d` (ink on accent `#0d0f08`, tints `accentTint` / `accentGlow`)
- Good / progress `#34d399`, danger `#ff6f6f`
- Card radius `RADIUS` = 18; font Manrope via `fontFor()` / the `Text` component
- Styling with plain React Native styles — no Tailwind/NativeWind or UI kits

### UX Principles
1. **Speed of logging** — every workout entry should take ≤10 seconds
2. **Visible progress** — users see their progress without navigating
3. **Positive reinforcement** — celebrate every milestone, no matter how small
4. **Mobile-first** — the app runs on phones only
5. **Accessible** — WCAG AA minimum; `accessibilityRole` / `-Label` / `-State` on all controls

## UX UI Pro Max Commands

| Command | Description |
|---------|-------------|
| `/start` | Onboarding for new people: setup check, short intro, ask what to change |
| `/ux-review` | Run a full UX/UI audit on recent changes |
| `/ui-agent` | Build new UI components with best practices |
| `/feedback` | Generate a comprehensive UX feedback report |
| `/design` | Create or update UI designs in Canva *(needs your own Canva connector)* |
| `/design-sync` | Sync Canva designs with the codebase *(Canva, optionally Google Drive)* |

Hooks in `.claude/settings.json`: after editing a UI file (`.tsx`, `.jsx`, `.html`, `.css`,
`.scss`) a hook reminds you to run `/ux-review`; the Stop hook reminds the user about the
commands. Canva / Google Drive / GitHub are optional connectors of whoever runs the session —
if one is not connected, say so instead of guessing tool names.

## Shipping Updates to Installed Devices (after EVERY app change)

Devices run an EAS-built APK (profile/channel `preview`, `runtimeVersion` = `expo.version` via
the `appVersion` policy). Uninstalling the app deletes all user data.

After every change to the app, always:
1. **Verify:** `npm run typecheck` and `npx expo export --platform android --output-dir /tmp/tf-export`.
2. **Decide OTA vs. new APK** (table in `ABLAUFPLAN.md`): JS/TS/assets only → OTA; new native
   module, Expo SDK bump, `version` bump or native `app.json` config → new APK build.
   Don't add packages with native code without the user's explicit OK.
3. **Hand the user both ways** (cloud sessions cannot reach expo.dev and have no `EXPO_TOKEN`;
   `eas` commands run on the user's PC with an Expo account that has access to the project):
   - Online: `eas update --branch preview --message "<what changed>"` (or `eas build` + install)
   - Fallback if online fails: USB-C + PowerShell — `scripts\USB-Installieren.cmd -Download`
     (EAS APK) or `scripts\APK-lokal-bauen.cmd` (local build signed with the EAS keystore).
     Details: `USB-INSTALLATION.md`.
4. **Keep the fallback working:** if `app.json`, `eas.json` or native deps change, re-check the
   scripts (package + version are read from `app.json`; channel `preview` is set in both
   scripts) and smoke-test `pwsh scripts/build-apk-local.ps1 -PrepareOnly` in a scratch copy.

Never change `android.package`, replace the signing keystore, or commit `credentials.json`,
`credentials/`, `*.jks` or APKs — a signature/package change forces an uninstall (= data loss).
PowerShell scripts must stay ASCII-only and Windows PowerShell 5.1 compatible (no `??`, ternary,
`&&`, multi-part `Join-Path`, `$IsWindows`); `.gitattributes` checks them out with CRLF
(`*.sh` with LF).

## Git Workflow

- `main` is the shipped state. Work on a feature branch and open a pull request against `main`;
  don't push to `main` directly.
- Run `/ux-review` before committing UI changes and `/feedback` before opening a PR that changes UI.
- Commit messages in German, short subject line + body explaining why.
- After merging app changes, publish them (step 3 above) — merging alone does not update devices.

## Project Docs

| File | Content |
|---|---|
| `ANLEITUNG.md` | Quick start for a new person (e.g. received the project as a ZIP) |
| `UEBERGABE.md` | Handover / onboarding: access, setup, working with Claude |
| `README.md` | Features, stack, setup |
| `ABLAUFPLAN.md` | Store-free distribution, OTA updates, when a new build is needed |
| `USB-INSTALLATION.md` | Fallback install/update via USB-C + PowerShell |
| `assets/svg/README.md` | Brand glyphs |
