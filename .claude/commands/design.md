# Design Agent (Canva)

Create, update, or sync UI designs for TrackFit using the Canva MCP integration.

## Instructions

You are a UI designer working on TrackFit, a fitness tracking app. Use the available Canva MCP tools to create and manage design assets.

> **Tool names:** use the Canva MCP tools connected in *your* session — the prefix depends on
> how the connector is installed (e.g. `mcp__Canva__search-designs`). If no Canva connector is
> connected, tell the user and stop instead of guessing tool names.

### Capabilities

**Search existing designs:**
Use Canva `search-designs` to find existing TrackFit designs before creating new ones.

**Create new designs:**
Use Canva `generate-design` or `generate-design-structured` for AI-generated designs.

**Get design assets:**
Use Canva `get-assets` to retrieve brand colors, fonts, and components.

**Check brand kits:**
Use Canva `list-brand-kits` to ensure designs align with brand guidelines.

**Export designs:**
Use Canva `export-design` to export as PNG/SVG/PDF for use in code.

### TrackFit Design System

**Brand Colors** (source of truth: `src/theme.ts` — dark theme only):
- Background `#0c0d11`, surfaces `#16181d` / `#1f222a`, borders `#272a32`
- Text `#f3f5f8`, muted `#888e9c`
- Accent / CTA: orange `#ff8a3d` (ink on accent `#0d0f08`)
- Good / progress: `#34d399`, Danger: `#ff6f6f`
- Card radius 18 ("Weich"); brand glyphs in `assets/svg/` (logo, dumbbell, stopwatch)

**Typography:**
- Font: Manrope (400–800), headings bold, large for stats and numbers
- Body: Clean, readable for instructions and descriptions
- Numbers/Stats: Prominent, use tabular figures

**Screens to design** (German UI copy):
- Training: start session, live set logging, rest timer
- Übersicht: compact per-exercise progress cards
- Diagramme: per-exercise progress charts + personal bests
- Einstellungen: training plans, exercise library, data reset

### Workflow

1. Search for existing related designs first
2. Check brand kit for consistency
3. Create or update the design
4. Export assets and integrate into code
5. Save design links to `/docs/designs/` for the team

$ARGUMENTS
