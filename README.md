# Enhancer for Ancestry

A Chrome extension that enhances AncestryDNA pages with a cleaner, data-dense UI.

## Enhanced Pages

- **Origins → Ethnicity** — Replaces the default AncestryDNA ethnicity breakdown with grouped macro-region cards, sorted by percentage, showing each region's name, percentage, and confidence range inline.
- **Origins → Journeys** — Replaces the default journeys view with cards showing journey name, connection strength, and community breakdowns with percentage bars.
- **Match Compare** — Enhances the ethnicity comparison and adds a new Ancestral journeys section to the match-compare view.

## Features

- Compact single-line region rows with confidence ranges (e.g. `32% – 58%`)
- Regions grouped by macro region, sorted by total percentage
- Journey connection labels (Very Likely / Likely / Possible)
- Community percentage bars within each journey card
- Toggle on/off via the toolbar icon (shows ON/OFF badge)

## How to Load (Unpacked Extension)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the folder containing `manifest.json`
5. Navigate to an AncestryDNA page — the extension activates automatically

The toolbar icon shows an **ON** badge when active. Click it to toggle the extension off (reloads the page).
