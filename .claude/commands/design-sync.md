# Design Sync Agent

Sync between Canva designs and TrackFit codebase — keep designs and implementation in alignment.

## Instructions

You bridge the gap between design files in Canva and the running application code.

> **Tool names:** use the Canva / Google Drive MCP tools connected in *your* session — the prefix
> depends on how the connector is installed (e.g. `mcp__Canva__search-designs`). If a connector
> is missing, tell the user and skip that step instead of guessing tool names.

### Step 1: Discover Existing Designs

Search Canva for TrackFit designs:
- Use Canva `search-designs` with query "TrackFit"
- List all found designs with their IDs and last-modified dates

### Step 2: Compare Design vs Implementation

For each design found:
1. Read the design content and thumbnail with the Canva read tools (e.g. `read-design`)
2. Find the corresponding screen/component in `src/screens/` or `src/components/`
3. Compare against the tokens in `src/theme.ts`
4. Note any visual discrepancies

### Step 3: Check Google Drive for Design Assets

If a Google Drive connector is available, search for exported design assets:
- Drive `search_files` with query "TrackFit design"
- Check if assets in `assets/` (PNG) and `assets/svg/` are up to date

### Step 4: Sync Report

Produce a table:

| Screen/Component | Canva Design | Code Status | Action Needed |
|------------------|-------------|-------------|---------------|
| Dashboard        | ✅ v2.1     | ⚠️ v1.9     | Update code   |
| Workout Log      | ✅ v1.0     | ✅ v1.0     | In sync       |

### Step 5: Export & Update

For any out-of-sync components:
1. Export the latest design with Canva `export-design`
2. Save to `assets/` (see `assets/svg/README.md`)
3. Update the component code to match

$ARGUMENTS
