# SVG-Quellgrafiken

Lege deine SVGs hier ab — ich verarbeite sie je nach Ordner unterschiedlich.

## `logo/`  → App-Icon (Launcher)
- Eine SVG, am besten quadratisch mit `viewBox` (z. B. `0 0 1024 1024`).
- Vollfarbig ist ok. Ich rastere sie zu allen benötigten PNGs:
  `icon.png`, `android-icon-foreground/background/monochrome.png`, `favicon.png`.

## `splash/`  → Startbildschirm
- Eine SVG (Motiv mittig). Hintergrund ist aktuell dunkel (`#0c0d11`).
- Ich rastere sie zu `splash-icon.png`.

## `exercises/`  → Übungs-Icons (in der App)
- Pro Übung eine SVG, benannt nach der Übungs-ID, z. B. `ex_bankdruecken.svg`
  (IDs stehen in `src/data/model.ts` → `SEED_EXERCISES`). Oder beliebige Namen,
  dann ordne ich sie zu / du sagst mir die Zuordnung.
- **Wichtig für Übungs-Icons:** einfarbige Pfade (`fill`), KEINE Verläufe/Bilder/Text,
  mit `viewBox` (idealerweise `0 0 24 24`). Diese binde ich als **Vektor** über
  `react-native-svg` ein — dann sind sie scharf in jeder Größe und werden in der
  jeweiligen Muskel-/Akzentfarbe eingefärbt.

## Format-Hinweise (für beste Ergebnisse)
- Immer ein `viewBox`-Attribut setzen.
- Pfad-basiert exportieren (Formen „zu Pfad konvertieren"); reine `<path>`-Fills
  funktionieren am zuverlässigsten beim Rastern.
- Verläufe/Filter/eingebettete Rasterbilder vermeiden (mein Offline-Renderer
  kann nur Pfad-Fills sauber umsetzen).
