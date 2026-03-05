# Frontend Plan: SoW Generator Pilot

## 1) Overview

A single-page application (SPA) built with vanilla HTML, CSS, and JavaScript.
No framework. No build step. Runs directly on GitHub Pages.

For stakeholder demo quality, the interface should feel polished and presentation-ready:
- strong visual hierarchy (hero header, clear sectioning, confident typography)
- modern card-based workspace with subtle motion and responsive behavior
- print-friendly output that looks like a deliverable, not a debug page

The app has four distinct views navigated via a top tab/step bar:
1. Topic Picker
2. Lesson Builder
3. SoW Preview
4. Hardware List

State is held in memory (a JS object) for the duration of the session.

---

## 2) File Structure

```
index.html
styles.css
app.js
data/
  topics.json
  hardware.json
  templates.json
```

All views are rendered into a single `<main id="app">` container in `index.html`.
Navigation swaps the active view without a page reload.

---

## 3) Views

### View 1: Topic Picker

**Purpose:** Let the lecturer browse and select topics to include in their SoW.

**Layout:**
- Left panel: search input + checkbox list of topics grouped by subject
- Right panel: running count of selected topics + "Next" button

**Behaviour:**
- Topics loaded from `data/topics.json` on app init
- Search filters by topic name in real time (no server call)
- Checking a topic adds it to the session state `selectedTopics[]`
- Topics already selected are visually marked
- "Next" is disabled until at least one topic is selected

---

### View 2: Lesson Builder

**Purpose:** Review selected topics, set durations, reorder lessons, and generate the SoW.

**Layout:**
- Top: class size input (number field, default 20)
- Middle: sortable list of selected lessons
  - Each row: drag handle, topic name, duration selector (45 / 60 / 90 min), remove button
- Bottom: "Generate SoW" button

**Behaviour:**
- Drag/drop reorder via SortableJS (CDN, no install)
- Duration defaults to `estimated_minutes` from topic data
- Class size is stored in session state for use in hardware calc
- Removing a topic here also deselects it in View 1
- "Generate SoW" assembles lesson cards from topic content blocks and advances to View 3

---

### View 3: SoW Preview

**Purpose:** Display the full generated Scheme of Work as readable lesson cards.

**Layout:**
- Header: SoW title (editable inline), total lessons, total hours
- Lesson cards in order, each card showing:
  - Lesson number + topic name + duration
  - Four content blocks: Outcomes, Explain, Practice, Assessment
  - Each block renders the stored HTML directly into a `<div>`
  - If a block is empty/missing: show a styled placeholder ("No content yet")
- Footer: "Print / Save as PDF" button, "Back" button, "View Hardware" button

**Behaviour:**
- Content rendered with `element.innerHTML = topic.content.outcomes_html` etc.
- Print button calls `window.print()`
- A `@media print` stylesheet hides nav, collapses to clean A4 layout

---

### View 4: Hardware List

**Purpose:** Show a deduplicated, scaled hardware recommendation list.

**Layout:**
- Class size display (pulled from session state, editable here too)
- "We already own" inputs per SKU (optional quantity subtraction)
- Table: SKU | Name | Required Kits | Already Own | To Order | Notes
- "Back" button

**Behaviour:**
- Flatten all `hardware_tags` from selected topics
- Look up each tag against `hardware.json` to resolve SKUs
- Deduplicate SKUs
- For each SKU: `required_kits = ceil(class_size / learners_per_kit)`
- `to_order = max(0, required_kits - already_own)`
- "Already own" defaults to 0, user can edit inline

---

## 4) Navigation / State

```
appState = {
  topics: [],           // loaded from topics.json
  hardware: [],         // loaded from hardware.json
  selectedTopics: [],   // ordered array of topic ids
  lessonDurations: {},  // topic_id -> minutes
  classSize: 20,
  sowTitle: "Scheme of Work",
  generatedLessons: []  // assembled on Generate
}
```

Navigation is a simple `showView(viewName)` function that:
- Hides all view containers
- Shows the target container
- Updates the active tab in the nav bar

No routing library needed.

---

## 5) Libraries (CDN only, no install)

| Library | Purpose | CDN |
|---|---|---|
| SortableJS | Drag/drop lesson reordering | jsDelivr |

No other dependencies. All other functionality is vanilla JS.

---

## 6) Styling

- Single `styles.css` file
- Mobile-friendly but desktop-first (lecturers likely on laptop)
- Visual direction: professional technical product (teal/navy core, warm accent, no dark mode dependency)
- Typography: expressive but readable web fonts, with clear heading/body contrast
- Motion: subtle panel/section reveal on load and lightweight hover feedback on interactive controls
- Print stylesheet embedded in `styles.css` via `@media print`
- Print layout: full width, no nav, no buttons, lesson cards stack vertically

---

## 7) Key Implementation Notes

- JSON loaded via `fetch('data/topics.json')` on page load. Works on GitHub Pages, not on raw `file://`.
- Never use `eval()`; only render trusted Matrix-authored JSON content.
- SoW title is the only user-editable text field; sanitize before print if needed.
- No localStorage. Session state is in memory only, refreshing resets the app (acceptable for pilot).

---

## 8) Print / Export Behaviour

The "Print / Save as PDF" button triggers the browser's native print dialog.
Lecturers choose "Save as PDF" from the printer dropdown. No server-side PDF generation needed.

Print CSS rules:
- Hide: nav bar, buttons, search panel, drag handles
- Show: all lesson cards in full
- Page breaks: `page-break-before: always` before each lesson card
- Font: serif for readability, 11pt

---

## 9) Out of Scope for Pilot Frontend

- User authentication
- Saving/loading SoWs between sessions
- Editing lesson content in-app
- Uploading files
- Exporting to Word, ZIP, or SCORM
- Any API calls
