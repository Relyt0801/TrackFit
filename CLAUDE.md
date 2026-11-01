# TrackFit — Claude Code Configuration

TrackFit is a fitness tracking app. This file defines project standards for Claude Code sessions.

## UX UI Pro Max Skill

This project has the full UX UI Pro Max Skill installed. Available commands:

| Command | Description |
|---------|-------------|
| `/ux-review` | Run a full UX/UI audit on recent changes |
| `/design` | Create or update UI designs in Canva |
| `/design-sync` | Sync Canva designs with the codebase |
| `/ui-agent` | Build new UI components with best practices |
| `/feedback` | Generate a comprehensive UX feedback report |

## MCP Integrations

- **Canva** (`mcp__233f22b9-*`): Design creation, brand assets, export
- **Google Drive** (`mcp__19f0dad7-*`): Asset storage, design docs, reports
- **GitHub** (`mcp__github__*`): PRs, issues, code review

## Design System

### Colors
- Primary: `#2563EB` (blue) or `#16A34A` (green)
- Accent/CTA: `#EA580C` (orange)
- Backgrounds: `#F9FAFB` (light), `#111827` (dark)
- Success: `#22C55E`, Warning: `#F59E0B`, Error: `#EF4444`

### UX Principles
1. **Speed of logging** — Every workout/meal entry should take ≤10 seconds
2. **Visible progress** — Users must see their progress without navigating
3. **Positive reinforcement** — Celebrate every milestone, no matter how small
4. **Mobile-first** — 80%+ of fitness tracking happens on mobile
5. **Accessible** — WCAG AA minimum for all UI

## Automatic Feedback

The session-end hook will remind you to run `/feedback` after any UI changes.
The post-edit hook will flag UI file changes for review.

## Project Structure

```
TrackFit/
├── .claude/
│   ├── settings.json     # Permissions & hooks
│   └── commands/         # UX UI Pro Max Skills
│       ├── ux-review.md
│       ├── design.md
│       ├── design-sync.md
│       ├── ui-agent.md
│       └── feedback.md
├── CLAUDE.md             # This file
├── ABLAUFPLAN.md         # Store-free distribution + OTA updates (EAS Update)
├── USB-INSTALLATION.md   # Fallback: install/update via USB-C + PowerShell
├── scripts/              # usb-install.ps1, build-apk-local.ps1 (+ double-click .cmd)
└── src/                  # App source code
```

## Shipping Updates to Installed Devices (after EVERY app change)

TrackFit is distributed without a store: devices run an EAS-built APK (profile/channel
`preview`, `runtimeVersion` = `expo.version` via the `appVersion` policy). All user data is
local only (AsyncStorage) — **uninstalling the app deletes it**.

After every change to the app, always:
1. **Verify:** `npm run typecheck` and `npx expo export --platform android --output-dir /tmp/tf-export`
   (that is the bundle `eas update` publishes).
2. **Decide OTA vs. new APK** (table in `ABLAUFPLAN.md`): JS/TS/assets only → OTA; new native
   module, Expo SDK bump, `version` bump or native `app.json` config → new APK build.
3. **Hand the user both ways** (cloud sessions cannot reach expo.dev and have no `EXPO_TOKEN`):
   - Online: `eas update --branch preview --message "<what changed>"` (or `eas build` + install)
   - Fallback if online fails: USB-C + PowerShell — `scripts\USB-Installieren.cmd -Download`
     (EAS APK) or `scripts\APK-lokal-bauen.cmd` (local build signed with the EAS keystore).
4. **Keep the fallback working:** if `app.json`, `eas.json` or native deps change, re-check the
   scripts (package + version are read from `app.json`; channel `preview` is set in both
   scripts) and smoke-test `pwsh scripts/build-apk-local.ps1 -PrepareOnly` in a scratch copy.

Never change `android.package`, replace the signing keystore, or commit `credentials.json`,
`credentials/`, `*.jks` or APKs — a signature/package change forces an uninstall (= data loss).
PowerShell scripts must stay ASCII-only and Windows PowerShell 5.1 compatible (no `??`, ternary,
`&&`, multi-part `Join-Path`, `$IsWindows`); `.gitattributes` checks them out with CRLF.

## Git Workflow

- Branch: `claude/ux-ui-pro-max-skill-hqjHY`
- Always run `/ux-review` before committing UI changes
- Always run `/feedback` before opening a PR
