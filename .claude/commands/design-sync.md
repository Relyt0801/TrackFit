# Design Sync Agent

Sync between Canva designs and TrackFit codebase — keep designs and implementation in alignment.

## Instructions

You bridge the gap between design files in Canva and the running application code.

### Step 1: Discover Existing Designs

Search Canva for TrackFit designs:
- Use `mcp__233f22b9-8aaf-4828-bad0-2e49184a8aab__search-designs` with query "TrackFit"
- List all found designs with their IDs and last-modified dates

### Step 2: Compare Design vs Implementation

For each design found:
1. Get design content: `mcp__233f22b9-8aaf-4828-bad0-2e49184a8aab__get-design-content`
2. Get design thumbnail: `mcp__233f22b9-8aaf-4828-bad0-2e49184a8aab__get-design-thumbnail`
3. Find the corresponding component in the codebase
4. Note any visual discrepancies

### Step 3: Check Google Drive for Design Assets

Use Google Drive MCP to find any exported design assets:
- `mcp__19f0dad7-f2d3-4f51-a4dc-ce93f6789a70__search_files` with query "TrackFit design"
- Check if assets in `/public/` or `/assets/` are up to date

### Step 4: Sync Report

Produce a table:

| Screen/Component | Canva Design | Code Status | Action Needed |
|------------------|-------------|-------------|---------------|
| Dashboard        | ✅ v2.1     | ⚠️ v1.9     | Update code   |
| Workout Log      | ✅ v1.0     | ✅ v1.0     | In sync       |

### Step 5: Export & Update

For any out-of-sync components:
1. Export the latest design: `mcp__233f22b9-8aaf-4828-bad0-2e49184a8aab__export-design`
2. Save to the project's design assets folder
3. Update the component code to match

$ARGUMENTS
