# TrackFit – Anleitung zum Start

Hallo! Du hast das Projekt **TrackFit** bekommen – eine Fitness-App für Android, die auf ein
paar Handys im Einsatz ist. Du arbeitest daran mit **Claude**: Du beschreibst in normalen Worten,
was geändert werden soll, und Claude setzt es um. Programmieren musst du dafür nicht können.

So geht's in 6 Schritten.

---

## 1. Ordner entpacken

Entpacke die ZIP-Datei nach **`C:\dev`**. Danach gibt es den Ordner **`C:\dev\TrackFit`**.
(Ein kurzer Pfad wie dieser vermeidet Probleme mit Windows. Den Ordner nicht umbenennen.)

## 2. Programme installieren (einmalig)

| Programm | Wofür | So geht's |
|---|---|---|
| **Node.js** (Version „LTS“) | lässt die App auf dem PC laufen | https://nodejs.org → Installer starten, überall „Weiter“ |
| **Git for Windows** | speichert Änderungen; wird von Claude gebraucht | https://git-scm.com/download/win → Installer starten, überall „Weiter“ |
| **Claude Code** | Claude, das direkt im Projekt arbeitet | siehe Befehl unten |
| *Expo Go* (optional) | die App live auf deinem Handy ansehen | im Google Play Store installieren |

**Claude Code installieren:** Startmenü öffnen, „PowerShell“ eintippen und starten, dann diese
Zeile eingeben und Enter drücken:

```powershell
irm https://claude.ai/install.ps1 | iex
```

Für Claude Code brauchst du ein **eigenes Claude-Konto mit Abo** (Pro oder Max – der kostenlose
Plan reicht dafür nicht). Beim ersten Start meldest du dich im Browser an.

> Nach der Installation **alle offenen Fenster schließen**, damit Windows die neuen Programme findet.

## 3. Claude starten

Im Ordner `C:\dev\TrackFit` auf **`Claude-starten.cmd`** doppelklicken.

Claude begrüßt dich, prüft, ob alles eingerichtet ist (und fragt, ob es fehlende Teile
installieren darf), erklärt dir kurz die App und fragt dann:

> **„Was soll an TrackFit geändert werden?“**

*Andere Wege:* In der **Claude-Desktop-App** (Bereich „Code“) den Ordner `C:\dev\TrackFit`
öffnen und `/start` eingeben. Auf **Mac/Linux** im Terminal in den Ordner wechseln, `claude`
starten und `/start` eingeben.

## 4. Deinen Wunsch beschreiben

Schreib einfach, was du dir vorstellst, zum Beispiel:
- „Ändere den Text ‚Training gespeichert‘ in ‚Super, Training gespeichert!‘“
- „Die Knöpfe im Training sollen größer sein.“
- „Füge ‚Bulgarian Split Squat‘ zu den Standard-Übungen hinzu.“
- „Erklär mir erst, wie die App aufgebaut ist.“

Claude fragt nach, wenn etwas unklar ist, setzt die Änderung um und prüft sie. Bei Dingen, die
für die Nutzer riskant wären (z. B. Datenverlust), warnt Claude vorher.

## 5. Auf dem Handy ausprobieren

Sag Claude: **„Starte die App, damit ich sie auf dem Handy ansehen kann.“**
Claude startet sie auf dem PC und zeigt einen **QR-Code** – den scannst du mit **Expo Go**.
Handy und PC müssen dafür im **selben WLAN** sein. Änderungen erscheinen sofort auf dem Handy.

## 6. Änderung zurückgeben

Deine Änderungen landen **nicht automatisch** bei den Nutzern. Sag Claude zum Schluss:
**„Ich bin fertig, bereite die Änderung für den Projektinhaber vor.“**

- **Hast du Zugang zu GitHub** (Einladung vom Projektinhaber angenommen)? Dann lädt Claude die
  Änderung hoch und erstellt einen *Pull Request*.
- **Sonst** erstellt Claude eine Datei **`TrackFit-aenderung.patch`** im Projektordner. Schick
  diese Datei an die Person, von der du das Projekt bekommen hast.

Der Projektinhaber prüft die Änderung und veröffentlicht sie – erst dann bekommen die Handys
der Nutzer das Update.

---

## Wenn etwas nicht klappt

| Problem | Lösung |
|---|---|
| „Claude Code wurde nicht gefunden“ | Schritt 2 (Claude Code) ausführen, dann **alle Fenster schließen** und neu doppelklicken |
| PowerShell: „Ausführung von Skripts ist deaktiviert“ | den Befehl aus Schritt 2 genau so eingeben (er ist davon nicht betroffen) – oder in Claude nachfragen |
| Claude fragt bei jedem Schritt um Erlaubnis | normal: Claude fragt, bevor es Befehle ausführt oder Dateien ändert. Lies kurz mit und bestätige |
| Handy findet die App nicht (Expo Go) | gleiches WLAN? Sonst Claude bitten: „Starte die App im Tunnel-Modus.“ |
| Sonstiges | Claude direkt fragen, z. B. „Warum klappt X nicht?“ |

**Bitte nicht:** die TrackFit-App auf den Handys der Nutzer deinstallieren und die Datei
`credentials.json` (falls du sie bekommst) an niemanden weitergeben. Mehr Hintergrund steht in
`UEBERGABE.md` – das brauchst du für den Start aber nicht.
