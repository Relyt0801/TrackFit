# TrackFit – Übergabe an eine neue Person (Arbeit mit Claude)

TrackFit ist ein Gym-Workout-Tracker (Expo / React Native, deutsche UI), der **ohne App-Store**
auf ein paar Android-Handys verteilt wird. Änderungen kommen als **Online-Update** (EAS Update)
auf die Geräte; als Notfall gibt es die Installation per **USB-C & PowerShell**.

> **Das Wichtigste vorweg:** Alle Trainingsdaten liegen **nur auf den Handys**. Wer die App
> deinstalliert, den Paketnamen oder den Signatur-Schlüssel ändert oder den Speicher-Schlüssel
> im Code umbenennt, **löscht die Daten der Nutzer**. Die Regeln dazu stehen in `CLAUDE.md` –
> Claude liest sie automatisch.

---

## Teil 1 – Für den bisherigen Owner: Zugänge freigeben

### 1. GitHub (Pflicht)
Repo **Relyt0801/TrackFit** → *Settings* → *Collaborators* → *Add people* → GitHub-Name der
neuen Person (Rolle **Write**). Sie arbeitet dann mit Branches und Pull Requests; du
reviewst und mergst.

### 2. Expo / EAS (nur wenn die Person selbst Updates veröffentlichen oder APKs bauen soll)
Das Expo-Projekt gehört dem Konto **relyt0801**. Zwei Möglichkeiten:

| | Ablauf | Aufwand |
|---|---|---|
| **A – du veröffentlichst** (empfohlen zum Start) | Person macht PR → du mergst → du führst `npm run update` aus | keiner |
| **B – gemeinsamer Zugriff** | Auf expo.dev eine **Organisation** anlegen, das Projekt dorthin übertragen, die Person als Mitglied einladen; danach `"owner"` in `app.json` auf den Organisationsnamen ändern und committen | einmalig ca. 15 Min. |

Bei Variante B:
- **Vorher den Signatur-Schlüssel sichern** (`eas credentials --platform android` → *Download
  credentials …*, siehe `USB-INSTALLATION.md`, Schritt 4).
- Die `projectId` (und damit die Update-Adresse in `app.json`) bleibt bei einer Übertragung
  gleich – die installierten Apps sollten also weiter Updates bekommen. **Danach einmal ein
  kleines Test-Update veröffentlichen** und auf einem Handy prüfen.
- Niemals das eigene Expo-Passwort weitergeben.

### 3. Signatur-Schlüssel (`credentials.json`)
Liegt sicher bei EAS. Die Person braucht ihn **nur** für den lokalen Notfall-Build ohne EAS
(Weg C in `USB-INSTALLATION.md`). Wenn nötig, nur über einen sicheren Kanal weitergeben
(z. B. geteilter Passwort-Manager) – **nie** per Mail/Chat und **nie** ins Git.

### 4. Claude
Die Person braucht ein **eigenes** Claude-Konto mit Claude Code (Desktop-App, CLI oder
claude.ai/code). Canva- oder Google-Drive-Connectoren sind optional und laufen über *ihr*
Konto – die Projekt-Commands sind dafür nicht an dein Konto gebunden.

---

## Teil 2 – Für die neue Person: Einstieg

### 1. Einrichten (ca. 15 Minuten)
Voraussetzungen: **Git**, **Node.js LTS** (https://nodejs.org), **Claude Code**, ein Handy mit
**Expo Go** (Play Store) zum Ausprobieren.

```bash
git clone https://github.com/Relyt0801/TrackFit.git
cd TrackFit
npm install
npm start
```
QR-Code mit Expo Go scannen → die App läuft live, Änderungen erscheinen sofort.
(Unter Windows das Projekt am besten nach `C:\dev\TrackFit` klonen – kurze Pfade vermeiden
Probleme beim nativen Build.)

### 2. Mit Claude arbeiten
- **Claude Code im Projektordner starten.** Claude liest `CLAUDE.md` automatisch: Architektur,
  Design-Tokens, Datenschutz-Regeln für gespeicherte Daten und der Update-Ablauf stehen dort.
- **Guter erster Auftrag:**
  *„Lies dich ins Projekt ein (CLAUDE.md, README.md, ABLAUFPLAN.md) und erklär mir die
  Architektur und wie ein Update auf die Handys kommt.“*
- **Projekt-Commands** (Slash-Commands in Claude Code):

  | Command | Wofür |
  |---|---|
  | `/ux-review` | UX/UI-Prüfung der letzten Änderungen – **vor jedem Commit mit UI-Änderungen** |
  | `/ui-agent` | Neue UI-Komponente im Stil der App bauen |
  | `/feedback` | Ausführlicher UX-Feedback-Bericht – **vor einem PR mit UI-Änderungen** |
  | `/design`, `/design-sync` | Entwürfe in Canva (nur mit eigenem Canva-Connector) |

- Nach dem Bearbeiten von UI-Dateien erinnert ein **Hook** Claude automatisch an `/ux-review`.
  Hooks laufen mit `bash` – unter Windows ist das mit **Git for Windows** (Git Bash) dabei.
- **Claude Code im Browser (claude.ai/code):** Das Repo muss dafür über GitHub verbunden sein.
  Aus der Cloud kann Claude expo.dev **nicht** erreichen – `eas`-Befehle (Update, Build) laufen
  immer auf deinem PC. Claude sagt dir am Ende jeder Änderung, welche Befehle nötig sind.

### 3. Arbeitsablauf
1. Neuen Branch anlegen (Claude macht das auf Wunsch).
2. Änderung umsetzen lassen und auf dem Handy in Expo Go prüfen.
3. Prüfen: `npm run typecheck` und `npx expo export --platform android --output-dir /tmp/tf-export`.
4. Bei UI-Änderungen `/ux-review`, vor dem PR `/feedback`.
5. Pull Request gegen `main` öffnen → Review → Merge.
6. **Erst dann** bekommen die Handys die Änderung: `npm run update` (wer Expo-Zugang hat,
   siehe Teil 1). Mergen allein ändert auf den Geräten nichts.

### 4. Goldene Regeln (sonst Datenverlust bei den Nutzern)
- `android.package` in `app.json` **nie** ändern, Signatur-Schlüssel **nie** austauschen.
- Speicher-Schlüssel `trackfit_v2` in `src/store/store.tsx` **nie** umbenennen; gespeicherte
  Felder nicht umbenennen/löschen – sonst sehen Nutzer nach dem Update eine leere App.
- **Keine Pakete mit nativem Code** ohne Absprache: die lassen sich nicht online verteilen, jedes
  Handy bräuchte eine Neuinstallation der APK.
- `version` in `app.json` nur bewusst erhöhen (erzwingt ebenfalls eine neue APK auf allen Geräten).
- `credentials.json`, `*.jks`, APKs **nie** committen (sind in `.gitignore`).

### 5. Wo steht was?

| Datei | Inhalt |
|---|---|
| `CLAUDE.md` | Projektregeln für Claude (Architektur, Design, Update-Pflichten) |
| `README.md` | Funktionen, Stack, Projektstruktur |
| `ABLAUFPLAN.md` | Verteilung ohne Store, Online-Updates, wann ein neuer Build nötig ist |
| `USB-INSTALLATION.md` | Notfall: Installation/Update per USB-C & PowerShell |
| `src/theme.ts` | Farben, Radien, Schrift (Design-Tokens) |

---

## Teil 3 – Übergabe-Checkliste

- [ ] Person ist GitHub-Collaborator auf Relyt0801/TrackFit
- [ ] Expo-Variante entschieden (A: du veröffentlichst · B: Organisation + Einladung)
- [ ] Signatur-Schlüssel gesichert (`credentials.json` an sicherem Ort)
- [ ] Person hat `npm install` + `npm start` erfolgreich mit Expo Go laufen
- [ ] Erste Claude-Session: Projekt erklärt bekommen, `CLAUDE.md` gelesen
- [ ] Erster kleiner PR (z. B. Text-Änderung) einmal komplett durchgespielt: PR → Merge → `npm run update` → Update auf einem Handy angekommen
