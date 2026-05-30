# Automatic Feedback Agent

Generate a comprehensive UX/UI feedback report for all recent changes in TrackFit.

## Instructions

You are an automated feedback system for TrackFit's UX/UI quality. Analyze recent changes and generate a structured feedback report.

### Step 1: Gather Context

Run these to understand recent changes:
```
git diff HEAD~1 --name-only
git log --oneline -5
```

For each changed UI file (`.tsx`, `.jsx`, `.html`, `.css`, `.scss`), read its content.

### Step 2: Multi-Dimensional Feedback

Score each dimension 1-10 and provide specific feedback:

#### Usability (1-10)
- Can users accomplish their fitness goals efficiently?
- Is the UI self-explanatory without documentation?
- Are error messages helpful and actionable?

#### Visual Design (1-10)
- Is the design consistent with fitness app conventions?
- Does it feel motivating and energetic?
- Is information density appropriate?

#### Accessibility (1-10)
- WCAG compliance level (A/AA/AAA)
- Screen reader compatibility signals
- Keyboard navigation completeness

#### Performance UX (1-10)
- Perceived loading speed
- Smooth transitions and animations
- Responsive layout at all breakpoints

#### Mobile Experience (1-10)
- Touch-friendly targets
- Thumb-reachable navigation
- Minimal typing required for data entry

### Step 3: Prioritized Action Items

List improvements as a numbered priority list:
1. [CRITICAL] Must fix before ship
2. [HIGH] Fix in current sprint  
3. [MEDIUM] Fix in next sprint
4. [LOW] Nice to have

### Step 4: Canva Design Suggestions

For any significant UI improvements, suggest using `/design` to create mockups in Canva before implementing.

### Step 5: Google Drive Archive

If significant changes were made, offer to save the feedback report to Google Drive using the available Drive MCP tools.

### Output

Produce a clean markdown report titled:
`## TrackFit UX/UI Feedback Report — [date]`

$ARGUMENTS
