# TrackFit – Ablaufplan: App ohne Store verteilen + automatische Updates

Diese App nutzt jetzt **EAS Update** (Over‑the‑Air‑Updates). Das heißt: Nach der
**einmaligen** Installation einer APK holen sich alle Geräte künftige Änderungen
**automatisch beim App‑Start** – ohne Play Store und ohne Neuinstallation.

> **Wo wird das ausgeführt?** Alle `eas …` / `npm …` Befehle laufen **auf deinem
> Computer** (Terminal/Eingabeaufforderung) im Projektordner – **nicht** auf dem Handy.
> Das Handy bekommt nur die fertige APK bzw. die Updates.

---

## 0. Voraussetzungen (einmalig, auf dem Computer)

1. **Node.js** installieren (https://nodejs.org, LTS).
2. **EAS CLI** installieren:
   ```bash
   npm install -g eas-cli
   ```
3. **Kostenloses Expo‑Konto** anlegen (https://expo.dev) und einloggen:
   ```bash
   eas login
   ```
4. **Projekt holen** (falls noch nicht lokal vorhanden) und Abhängigkeiten installieren:
   ```bash
   git clone https://github.com/Relyt0801/TrackFit.git
   cd TrackFit
   npm install
   ```

---

## 1. Projekt mit EAS verbinden (einmalig) — ✅ erledigt am 02.07.2026

> `app.json` enthält bereits `extra.eas.projectId` und `updates.url`
> (Projekt `a5d7e496-…`, Owner `relyt0801`). Nur bei einem neuen Expo-Konto wiederholen.

Im Projektordner (dort, wo die `package.json` liegt):

```bash
eas init               # legt das Projekt an, schreibt projectId + owner in app.json
eas update:configure   # trägt Update-URL & runtimeVersion ein
```

> Diese zwei Befehle ergänzen automatisch die kontospezifischen Werte
> (`extra.eas.projectId`, `updates.url`) in der `app.json`. Den Rest der
> Update‑Konfiguration habe ich bereits eingebaut.

Danach committen, damit alle Geräte/Builds dieselbe Konfiguration nutzen:
```bash
git add app.json && git commit -m "EAS-Projekt verknüpft" && git push
```

---

## 2. Erste App MIT Update‑Funktion bauen (einmalig pro Gerät installieren)

```bash
eas build --platform android --profile preview
# Kurzform: npm run build:apk
```

- Der Build läuft auf den Expo‑Servern. Am Ende bekommst du einen **Link/QR‑Code**.
- **APK herunterladen** und auf **jedem** Gerät installieren
  (die alte TrackFit‑App vorher deinstallieren oder einfach drüber installieren).
- ⚠️ **Diese eine Neuinstallation ist nötig**, weil die Auto‑Update‑Fähigkeit selbst
  Teil dieses Builds ist. Die aktuell installierte alte App kann sie noch nicht haben.

> Diese erste APK enthält bereits den neuen **Übersicht**‑Tab.

---

## 3. Künftige Änderungen live schicken (jederzeit, ohne Neuinstallation) ✅

Nach Code‑Änderungen einfach:

```bash
eas update --branch preview --message "Was wurde geändert"
# Kurzform: npm run update
```

→ Beim **nächsten App‑Start** prüft jedes Gerät automatisch, lädt das Update und
startet direkt in die neue Version. Kein Store, keine Neuinstallation.
App dafür ganz schließen (aus der App‑Übersicht wischen) und neu öffnen.

> **Update kommt nicht an?** (Handy offline, Update‑Server gestört, App älter als die
> Update‑Einrichtung, nativer Build nötig) → **Weg B/C per USB‑C & PowerShell**, siehe
> [USB-INSTALLATION.md](USB-INSTALLATION.md).

---

## 4. Notfall‑Plan: Installation per USB‑C & PowerShell

Falls die Online‑Funktion nicht geht, liegt alles für die Installation per Kabel bereit:

| Situation | Doppelklick / Befehl |
|---|---|
| Neueste EAS‑APK laden und per USB installieren | `scripts\USB-Installieren.cmd -Download` |
| Schon geladene APK aus `releases\` installieren (offline) | `scripts\USB-Installieren.cmd` |
| expo.dev nicht erreichbar → lokal bauen + installieren | `scripts\APK-lokal-bauen.cmd` |

Die App wird dabei **über** die vorhandene installiert – Trainingsdaten bleiben erhalten.
Einmalige Vorbereitung (USB‑Debugging, Signatur‑Schlüssel sichern, APK vorab laden) und
Fehlerbehebung: **[USB-INSTALLATION.md](USB-INSTALLATION.md)**.

---

## Wann reicht ein Update – wann braucht es einen neuen Build?

| Änderung | Was tun |
|---|---|
| JS/TSX: Screens, Logik, Styles, Texte | `eas update` reicht ✅ |
| Neues **natives** Paket (z. B. Kamera, Notifications) | neuer `eas build` + 1× neu installieren 🔁 |
| Expo‑SDK‑Upgrade | neuer `eas build` + 1× neu installieren 🔁 |
| `version` in `app.json` erhöht | neuer `eas build` + 1× neu installieren 🔁 |

Grund: `runtimeVersion` ist an die `version` gekoppelt (Policy `appVersion`). OTA‑Updates
werden nur an Builds mit **gleicher** `runtimeVersion` ausgeliefert. So kann eine alte
App nie ein inkompatibles Update bekommen.

---

## Was im Code bereits eingebaut ist

- `expo-updates` als Abhängigkeit (`package.json`).
- `app.json`: `updates` (aktiviert, Prüfung beim Start) + `runtimeVersion`‑Policy.
- `eas.json`: Update‑**Channels** je Build‑Profil (`preview`, `production`, `development`).
- `src/utils/updates.ts` + Aufruf in `App.tsx`: prüft beim Start auf ein Update, lädt es
  und startet automatisch hinein. In der Entwicklung / in Expo Go passiert nichts (no‑op).
- `npm run build:apk` und `npm run update` als Kurzbefehle.
- `scripts\` mit dem USB‑Notfall‑Weg (`usb-install.ps1`, `build-apk-local.ps1` + Doppelklick‑`.cmd`)
  sowie `npm run apk:download`, `npm run usb:install`, `npm run build:apk:local`.

---

## Schnell zum Ausprobieren (ohne Build, nur Entwicklung)

```bash
npx expo start
```
Dann in der **Expo Go**‑App den QR‑Code scannen. Gut zum sofortigen Testen –
ersetzt aber nicht die installierte APK.
