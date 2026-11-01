---
name: start
description: Onboarding for a person who is new to TrackFit - greet in German, check the setup, explain the app briefly, then ask what should be changed and wait. Use when the session starts with /start, with a greeting but no concrete task, or when someone says they are new or asks for onboarding (the Claude-starten.cmd launcher sends such a message).
---

# Onboarding (/start)

Welcome a person who is new to TrackFit and find out what they want to change.
**Speak German**, friendly and short. The person may not be a developer — avoid jargon, explain
terms in one half-sentence when you need them.

## 1. Greet

Start with: „Hallo! Ich bin Claude und helfe dir bei TrackFit.“

## 2. Check the setup (quietly — only report problems)

Run these checks yourself; do not ask the person to type commands:
- `node --version` — Node.js must be installed (LTS). If missing: point to https://nodejs.org and stop the check.
- `git --version` and `git status --short --branch` — note the branch and uncommitted changes.
- Does `node_modules/` exist? If not, **ask** whether you may run `npm install` now (takes 1–2 minutes), then run it.

If everything is fine, say so in one sentence („Alles ist eingerichtet.“).

## 3. Explain briefly (max. 4 short sentences)

- TrackFit is a gym workout tracker with four tabs: Training, Übersicht, Diagramme, Einstellungen.
- You can show every change live on a phone with Expo Go (`npm start`, scan the QR code).
- Changes reach the users' phones only after they are published (online update by the project owner).
- Training data lives only on the users' phones, so a few things are off-limits (see CLAUDE.md) — you watch out for that.

## 4. Ask what should change — then wait

Ask: **„Was soll an TrackFit geändert werden?“** and offer examples, e.g.:
- einen Text oder eine Beschriftung ändern
- Farben, Abstände oder das Layout eines Bildschirms anpassen
- eine neue Standard-Übung oder einen Trainingsplan hinzufügen
- eine neue Funktion (z. B. eine Statistik oder Anzeige)
- „Erklär mir erst die App bzw. den Code.“

Then **stop and wait for the answer. Do not change any files before the person has said what they want.**

## When they answer

1. Restate the change in 1–2 sentences; ask at most 2 clarifying questions if really needed.
2. Say whether it can ship as an online update or needs a new APK on every phone (see CLAUDE.md),
   and warn clearly before anything on CLAUDE.md's "never" list (package name, keystore,
   storage key, native packages, version bump).
3. Create a branch (e.g. `aenderung/<kurzer-name>`), implement, run `npm run typecheck` and
   `npx expo export --platform android --output-dir <temp dir>`; for UI changes run `/ux-review`.
4. Tell the person how to try it (`npm start` → Expo Go) and ask if it looks right.
5. Commit with a German message. Then hand the change back to the project owner:
   - **with GitHub write access:** push the branch and open a pull request against `main`;
   - **without GitHub access** (project came as a ZIP): create a patch file with
     `git format-patch origin/main --stdout > TrackFit-aenderung.patch` and tell the person to
     send that file to the project owner (who applies it with `git am TrackFit-aenderung.patch`).
6. Finish by explaining that the users' phones get the change only after the owner publishes it
   (`npm run update`).

$ARGUMENTS
