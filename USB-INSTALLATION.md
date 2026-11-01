# TrackFit – Updates verteilen & Notfall-Installation per USB-C (PowerShell)

Diese Anleitung beschreibt, wie ein Update auf die Handys kommt, die TrackFit schon
haben – und was du tust, wenn der Online-Weg nicht funktioniert.

> **Wichtigste Regel:** TrackFit speichert alle Trainings, Pläne und das Profil **nur lokal
> auf dem Handy**. Bei einer **Deinstallation sind diese Daten weg**. Alle Wege hier
> installieren deshalb **über** die vorhandene App (`adb install -r`) – die Daten bleiben erhalten.

---

## Überblick: drei Wege

| Weg | Wann? | Befehl (auf dem PC im Projektordner) |
|---|---|---|
| **A – Online-Update** (Standard) | JS-/UI-Änderungen, Handy hat Internet | `npm run update` |
| **B – EAS-APK per USB-C** | Update kommt nicht an · nativer Build nötig · neues Handy | `scripts\USB-Installieren.cmd -Download` |
| **C – Lokal bauen + USB-C** | expo.dev / EAS Build nicht erreichbar | `scripts\APK-lokal-bauen.cmd` |

Die `.cmd`-Dateien kannst du auch einfach im Explorer **doppelklicken**.
Sie starten die PowerShell-Skripte in `scripts\` (die PowerShell-Ausführungsrichtlinie wird
dabei nur für diesen einen Aufruf umgangen – an deinem System wird nichts verstellt).

---

## ✅ Jetzt vorbereiten – solange alles online ist (einmalig)

Damit der Notfall-Weg im Ernstfall sofort klappt:

1. **Handys:** USB-Debugging einschalten → [Anleitung unten](#handy-vorbereiten-usb-debugging).
2. **PC:** Node.js LTS installieren (https://nodejs.org), dann in PowerShell:
   ```powershell
   git clone https://github.com/Relyt0801/TrackFit.git C:\dev\TrackFit
   cd C:\dev\TrackFit
   npm install
   npm install -g eas-cli
   eas login
   ```
   > Ein **kurzer Pfad** wie `C:\dev\TrackFit` vermeidet Probleme beim lokalen Build
   > (Windows-Grenze von 260 Zeichen für Pfade).
3. **Aktuelle APK schon herunterladen** (landet in `releases\`):
   ```powershell
   npm run apk:download
   ```
4. **Signatur-Schlüssel sichern** – nötig für Weg C:
   ```powershell
   eas credentials --platform android
   ```
   → Profil **preview** → **credentials.json: Upload/Download credentials …** →
   **Download credentials from EAS to credentials.json**.
   Das erzeugt `credentials.json` und `credentials\android\keystore.jks` im Projektordner.
   - Beide Dateien sind in `.gitignore` und werden **nie** committet.
   - Lege zusätzlich eine **Kopie an einem sicheren Ort** ab (USB-Stick, Passwort-Manager).
     Ohne diesen Schlüssel lässt sich nie wieder eine APK bauen, die man über die
     installierte App drüber installieren kann.
5. **Probelauf:** Handy per USB-C anschließen und `scripts\USB-Installieren.cmd` doppelklicken.
   Fehlt `adb`, bietet das Skript an, es automatisch von Google zu laden (ca. 10 MB,
   nach `tools\platform-tools\`).
6. *(Optional, für Weg C)* **Android Studio** installieren und einmal starten – das bringt
   Java (JDK) und das Android SDK mit. Danach einmal `scripts\APK-lokal-bauen.cmd` testen.

---

## Weg A – Online-Update (Normalfall)

Für alle Änderungen an Screens, Logik, Styles und Texten:

```powershell
eas update --branch preview --message "Was wurde geändert"
```

(Kurzform: `npm run update`)

**So kommt es auf die Handys:** Beim nächsten **Start** fragt jede installierte TrackFit-App
den Update-Server, lädt das Update und startet direkt in die neue Version.
- App dafür **ganz schließen** (aus der App-Übersicht wischen) und neu öffnen.
- Bei langsamem Netz wartet die App bis zu 8 s; dauert es länger, ist das Update beim
  **übernächsten** Start aktiv.
- Kein Store, keine Neuinstallation, Daten bleiben erhalten.

**Online-Update reicht NICHT** (→ Weg B), wenn:
- ein neues **natives** Paket dazukommt, das Expo-SDK aktualisiert oder die `version` in
  `app.json` erhöht wird (Details: [ABLAUFPLAN.md](ABLAUFPLAN.md#wann-reicht-ein-update--wann-braucht-es-einen-neuen-build)),
- die installierte App noch **vor der Update-Einrichtung** gebaut wurde (vor dem 02.07.2026):
  solche Apps fragen gar nicht nach Updates. Das USB-Skript zeigt dir pro Handy, wann die
  App zuletzt installiert/aktualisiert wurde.

---

## Weg B – EAS-APK per USB-C installieren

Wenn das Online-Update nicht ankommt (Handy ohne Internet, Update-Server-Problem, alte App)
oder ein neuer nativer Build nötig ist.

1. Handy per USB-C anschließen, entsperren.
2. Am PC eine der Varianten wählen:

   | Ziel | Befehl |
   |---|---|
   | Neueste fertige APK von EAS laden **und** installieren | `scripts\USB-Installieren.cmd -Download` |
   | Neuen Cloud-Build starten, warten (10–20 Min.), installieren | `scripts\USB-Installieren.cmd -Build` |
   | Schon geladene APK aus `releases\` installieren (offline) | `scripts\USB-Installieren.cmd` |
   | Bestimmte APK-Datei installieren | `scripts\USB-Installieren.cmd -Apk "C:\Pfad\app.apk"` |

3. Das Skript
   - sucht bzw. lädt `adb`,
   - findet **alle** angeschlossenen Handys (mehrere nacheinander möglich; nur eines: `-Serial <ID>`),
   - zeigt die installierte Version, fragt einmal nach und installiert mit `adb install -r`,
   - startet die App danach automatisch.

Aus einem PowerShell-Fenster geht dasselbe direkt:
```powershell
.\scripts\usb-install.ps1 -Download
```
> Meldet PowerShell *„Die Ausführung von Skripts ist auf diesem System deaktiviert“*, nimm
> die `.cmd`-Datei oder starte mit
> `powershell -ExecutionPolicy Bypass -File .\scripts\usb-install.ps1 -Download`.

---

## Weg C – Ohne EAS-Cloud lokal bauen + USB-C

Wenn expo.dev nicht erreichbar ist (Ausfall, kein Build-Kontingent mehr, …).
**Voraussetzung:** Schritt 4 und 6 der Vorbereitung (Schlüssel + Android Studio).

```powershell
scripts\APK-lokal-bauen.cmd
```
(= `.\scripts\build-apk-local.ps1 -Install`)

Das Skript
1. erzeugt den nativen `android\`-Ordner (`npx expo prebuild`, `package.json` bleibt unverändert),
2. trägt den Update-Channel **preview** ein, damit die App danach **weiter Online-Updates** bekommt,
3. baut die Release-APK mit Gradle (erster Lauf 10–30 Min.),
4. signiert sie mit dem **EAS-Schlüssel** aus `credentials.json` → lässt sich über die
   vorhandene App installieren,
5. legt sie als `releases\TrackFit-<version>-local-<datum>.apk` ab und installiert sie per USB.

Nützliche Optionen: `-VersionCode <n>` (bei *VERSION_DOWNGRADE*), `-PrepareOnly`
(nur `android\` erzeugen, z. B. für Android Studio), `-AllowDebugKey` (siehe unten).

> **Ohne `credentials.json`** bricht das Skript bewusst ab. Mit `-AllowDebugKey` baut es
> trotzdem – so eine APK passt aber **nur auf Handys ohne TrackFit**. Auf Handys mit der
> EAS-App ginge sie nur nach Deinstallation (= Datenverlust) und würde danach auch keine
> EAS-APKs mehr annehmen. Nur als allerletzter Ausweg.

---

## Handy vorbereiten (USB-Debugging)

Einmalig pro Handy:

1. **Entwickleroptionen freischalten:** Einstellungen → *Telefoninfo*
   (Samsung: → *Softwareinformationen*) → **7× auf „Buildnummer“ tippen**.
2. Einstellungen → *Entwickleroptionen* (Samsung/Pixel: unter *System*) → **USB-Debugging** an.
   - **Xiaomi/Redmi/POCO:** zusätzlich **„Über USB installieren“** aktivieren.
3. Per USB-C an den PC – mit einem **Datenkabel** (reine Ladekabel funktionieren nicht).
4. Auf dem Handy **„USB-Debugging zulassen?“** → *Immer von diesem Computer zulassen* → **Zulassen**.

---

## Fehlerbehebung

| Meldung / Problem | Lösung |
|---|---|
| *Kein Handy gefunden* | Datenkabel? USB-Debugging an? Handy entsperrt? USB-Modus *Dateiübertragung*. Samsung: *Samsung USB Driver* installieren. |
| `unauthorized` | Handy entsperren, Dialog „USB-Debugging zulassen?“ bestätigen. Kommt keiner: Entwickleroptionen → *USB-Debugging-Autorisierungen widerrufen*, Kabel neu stecken. |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | APK hat einen **anderen Signatur-Schlüssel**. **Nicht deinstallieren!** EAS-APK nehmen (`-Download`) oder lokal mit `credentials.json` bauen. Nur wenn die Daten egal sind: `-Reinstall`. |
| `INSTALL_FAILED_VERSION_DOWNGRADE` | Auf dem Handy ist ein höherer `versionCode`. Neuere APK nehmen bzw. lokal mit `-VersionCode <höher>` bauen. |
| `INSTALL_FAILED_USER_RESTRICTED` | Rückfrage am Handy bestätigen; Xiaomi: „Über USB installieren“ aktivieren. |
| `eas … fehlgeschlagen` | `eas login` ausführen; ist expo.dev nicht erreichbar → Weg C. |
| Gradle: *Filename longer than 260 characters* | Projekt nach `C:\dev\TrackFit` verschieben oder Windows-„Long Paths“ aktivieren (das Skript zeigt den Befehl). |
| Update kommt trotz Weg A nicht an | App ganz schließen und 2× neu starten; Handy online? Sonst Weg B. |

`-Reinstall` deinstalliert vorher und **löscht alle Trainingsdaten** – das Skript verlangt
dafür ausdrücklich die Eingabe `LOESCHEN`.

---

## Dateien

| Datei | Zweck |
|---|---|
| `scripts\USB-Installieren.cmd` | Doppelklick-Start für `usb-install.ps1` |
| `scripts\APK-lokal-bauen.cmd` | Doppelklick-Start für `build-apk-local.ps1 -Install` |
| `scripts\usb-install.ps1` | adb besorgen, APK beschaffen (`-Download`/`-Build`/`-Apk`), auf alle Handys installieren |
| `scripts\build-apk-local.ps1` | lokaler Release-Build + Signatur mit EAS-Schlüssel |
| `releases\` | heruntergeladene/gebaute APKs *(nicht im Git)* |
| `tools\platform-tools\` | automatisch geladenes adb *(nicht im Git)* |
| `credentials.json`, `credentials\` | EAS-Signaturschlüssel *(nie ins Git, sicher aufbewahren)* |

npm-Kurzbefehle: `npm run update` · `npm run build:apk` · `npm run apk:download` ·
`npm run usb:install` · `npm run build:apk:local`

Die Skripte laufen mit der in Windows 10/11 eingebauten **Windows PowerShell 5.1** – es muss
nichts zusätzlich installiert werden.
