# Plan 3: Low-Tech Pilot (GitHub Pages First)

## 1) Pilot Objective
Build a usable Scheme of Work (SoW) proof of concept that lecturers can try quickly, with:
- topic selection
- lesson ordering
- in-app viewing of lesson assets
- generated SoW summary
- basic hardware recommendation list

No backend is required for the pilot.

## 2) What Changes From Plan 1 + Plan 2
Both existing plans are solid, but they are too broad for a first pilot.

This merged plan keeps:
- structured topic + asset model
- lecturer-controlled ordering (no forced prerequisite logic)
- in-app lesson pack viewing
- deterministic generation rules
- hardware dedup/recommendation logic

This merged plan defers:
- CMS (Strapi/Airtable)
- database setup
- file conversion pipeline workers
- AI features
- multi-tenant access control
- advanced exports (ZIP, SCORM, Word)

## 3) Pilot Scope (4 Weeks)
Pilot domain: Electrical Fundamentals only.

Content target:
- 20-30 topics
- minimum 3 assets per topic (recommended baseline: teacher notes, worksheet PDF, slides PDF/image set)
- optional: short quiz JSON

Users:
- 2-3 internal lecturers for testing

## 4) Technical Approach (GitHub Pages Compatible)
Use a static web app in this repo:
- `index.html`
- `styles.css`
- `app.js`
- `data/*.json`

No server-side code.
No runtime database.
All content in JSON + static files committed to Git.

## 5) Minimal Data Design
Create simple JSON files:

`data/topics.json`
- `id`
- `name`
- `subject`
- `level`
- `estimated_minutes`
- `hardware_tags` (array)

`data/topics.json` also stores lesson content blocks (plain text or simple HTML), for example:
- `content.outcomes_html`
- `content.explain_html`
- `content.practice_html`
- `content.assessment_html`

`data/hardware.json`
- `sku`
- `name`
- `supports_tags` (array)
- `learners_per_kit`
- `notes`

`data/templates.json`
- one default 60-minute lesson template
- ordered blocks (`outcomes`, `explain`, `practice`, `assessment`)

## 6) MVP Features
1. Topic picker
- checkbox list grouped by subject/domain
- search filter

2. Selected lesson list
- drag/drop reorder
- manual lesson duration per lesson (45/60/90)

3. Generate button
- produce lesson cards in selected order
- pull lesson block content directly from topic data
- if a block is missing, show explicit placeholder text

4. In-app viewer
- render lesson HTML/text in a content panel (no file embed)

5. SoW summary view
- lesson number, topic, duration, key assets
- browser print stylesheet for "Save as PDF"

6. Hardware recommendations (simple deterministic)
- flatten all selected `hardware_tags`
- deduplicate SKUs
- apply class-size scaling
- `required_kits = ceil(class_size / learners_per_kit)`
- optional "we already own X" subtraction

## 7) Delivery Plan
### Week 1: Foundation
- Define JSON schemas and seed 10 sample topics
- Build topic selector + selected list UI
- Add drag/drop ordering

### Week 2: Generator + Viewer
- Implement lesson assembly rules using topic content blocks
- Add placeholders for missing blocks
- Build content renderer (render lesson HTML from JSON)

### Week 3: SoW + Hardware
- Add SoW summary page
- Add print-to-PDF layout
- Implement hardware dedup + scaling + ownership subtraction

### Week 4: Pilot Hardening
- Expand to 20-30 topics
- Fix usability issues from lecturer feedback
- Freeze pilot release on GitHub Pages

## 8) GitHub Pages Deployment
Use GitHub Actions for static deploy.

1. Push repo to GitHub
2. Add workflow `.github/workflows/deploy.yml` to publish root files (or `dist/` if later using a build tool)
3. Enable Pages: Source = GitHub Actions
4. Verify public URL and run pilot from that link

## 9) Acceptance Criteria
Pilot is successful if lecturers can:
- select topics and reorder them
- generate a coherent 6-20 lesson SoW
- open worksheets/slides inside the app
- print/export SoW as PDF
- view a clear, deduplicated hardware list for class size

## 10) Post-Pilot Upgrade Path
After pilot validation, then decide if you need:
- migrate content to a backend CMS/database
- admin CMS
- database-backed content model
- upload/conversion pipeline
- richer exports (ZIP/VLE)
- authentication and permissions
