Detailed plan: Matrix TSL Scheme of Work Generator (in-app content, lecturer-driven)
Goal

A web app that lets Matrix staff ingest and structure internal learning material, then lets lecturers select topics (checkbox tree) and generate a Scheme of Work plus fully viewable in-app Lesson Packs. Exports are optional.

Phase 0: Define the product rules (1 to 2 days)

Non-negotiables

No automatic prerequisites or forced lesson inserts.

Lecturer selections control scope and order.

All content viewable inside the app (no external dependency as the main path).

Export is a convenience feature, not required for use.

Decisions to lock

Lesson duration defaults (eg 60 min) and allowed durations (45/60/90).

Output formats for export (PDF first, Word later).

Content approval workflow (Draft vs Approved).

Deliverable: 1 page product spec with scope and exclusions.

Phase 1: Data model and information architecture (foundation)
1. Topic taxonomy (checkbox tree)

Structure:

Subject (Electrical, Mechanical, Automation, etc.)

Domain (Fundamentals, Power, Aerospace, etc.)

Topic (Ohm’s Law, Kirchhoff, Aerodynamics, etc.)

Optional sub-topic level

Fields:

topic_id, name, parent_id, path

tags: level (L2/L3/HND), unit mapping (optional), keywords

estimated_teaching_time (minutes)

status (active/archived)

2. Asset library (raw inputs)

Asset types:

Text/Teacher notes

Worksheet

Slides

Video

Quiz

Lab sheet / practical guide

Assessment / assignment brief

Answer sheet / mark scheme

Fields:

asset_id, title, type, version, owner, status (draft/approved)

storage pointer (file path) or block content

topics (many-to-many)

level tags, duration tags

pedagogy tags: intro/explain/practice/assessment/extension

created_at, updated_at, last_reviewed

3. Lesson Pack blueprint (how lessons render)

A Lesson Pack is an ordered list of blocks:
Block types:

Outcomes

Starter

Explain

Worked examples

Guided practice

Independent practice

Assessment

Homework/extension

Practical setup/safety (optional)

Fields:

lesson_template_id, name, intended_duration

block definitions with required/optional blocks

rules for what asset types can fill each block (eg slides go into Explain)

4. Generated course object

When a lecturer builds a course:

course_id, name, created_by, created_at

selected topics (and selected variant per topic)

generated lessons (ordered)

each lesson contains block list referencing assets

Deliverable: ERD and schema draft (Postgres).

Phase 2: Content ingestion pipeline (make everything viewable in-app)
Upload and normalisation (critical)

You want consistent in-app viewing, so convert formats on upload.

PDF

Store original PDF

Render in browser with embedded viewer

PPTX

Convert to:

PDF (for export and quick view)

slide images (PNG/WebP) for a “slide player” in-app

Store original PPTX as archive if needed

DOCX
Two options:

Convert to HTML blocks for best in-app experience

Or convert to PDF for simplest consistent view
Recommendation: start with PDF in MVP, move to HTML blocks later.

Video

Prefer self-hosted (S3 or streaming service) and play in-app

Store: video file + poster + transcript (optional)

If you must support YouTube initially, still embed in-app and treat as temporary

Deliverable: upload service + conversion worker + asset status updates.

Phase 3: Admin tools (Matrix staff)
Admin features (MVP set)

Topic Manager

CRUD topics

Drag/drop re-order

Bulk import topics via CSV

Asset Manager

Upload file

Auto conversion status (Processing, Ready, Failed)

Tag to topics

Set asset type, level, pedagogy tags

Preview asset in-app

Approve/publish

Lesson Template Manager

Define templates (60-min theory, 60-min practical, 2x60 split, revision)

Configure required blocks and allowable asset types per block

Coverage dashboard

For each topic: what assets exist vs missing (slides/worksheet/quiz etc.)

This drives your internal content roadmap

Deliverable: an admin panel that makes building the library fast.

Phase 4: Lecturer course builder (user experience)
Lecturer workflow (MVP)

Create Course

Course name

Choose defaults (lesson length, level)

Select Topics (checkbox tree)

Search bar (type “ohm” finds Ohm’s Law)

Filters by level and subject

Each selected topic shows “available lesson variants” (based on templates and assets)

Arrange order

Lecturer can drag to reorder lessons

No forced prereq logic

Generate

The generator creates:

Scheme of Work

Lesson Packs

Deliverable: lecturer-facing builder plus saved courses.

Phase 5: Generator logic (deterministic, reliable)

No AI required in MVP.

Lesson assembly rules

For each selected topic:

Pick a lesson template variant (default if not chosen)

For each block in the template:

Select best matching asset by:

topic match

asset type required for that block

level match

approval status = Approved

then most recent version

If an asset is missing:

Insert a placeholder block:

“No Matrix slides for Explain block”

“Worksheet missing”
This keeps output usable and shows gaps.

Course assembly rules

Use lecturer ordering

If lesson duration mismatch occurs:

either split into two lessons (if template supports)

or flag “overfull lesson” warning

Deliverable: generator service and consistent lesson output.

Phase 6: In-app Lesson Pack viewer (the main value)
Lesson Pack page requirements

Tabs or sections for each block in order

Embedded:

slide player (converted images)

PDF viewer

text blocks

quizzes (native components)

Teacher controls:

“Present mode” for slides

“Print worksheet”

“Mark scheme” access toggle (optional)

Deliverable: a clean lesson delivery interface.

Phase 7: Export (secondary)

Start with PDF. Word later.

Export outputs

Scheme of Work PDF

table of lessons

outcomes, timing, resources (internal references)

Optional Lesson Pack PDF bundle

cover page

lesson summaries

appendices (worksheets/slides as PDFs)

Deliverable: PDF export service with consistent branding.

Phase 8: Security, licensing, and tenancy
Access control

Matrix Admins: full control

Lecturer users: view and generate from published library only

Optional: College admin

Content protection (realistic baseline)

Signed URLs for files

Watermarking on exports (optional)

Disable direct download for certain assets (optional)

Audit logs for export/download

Deliverable: roles, permissions, audit trail.

Phase 9: Pilot plan (how to make it real quickly)
Pick one pilot domain

Recommended: Electrical Fundamentals.

30 to 50 topics

3 to 5 assets per topic minimum for “good output”

slides

worksheet

teacher notes

short quiz

mark scheme

Pilot milestones

Week 1: taxonomy + asset ingestion working

Week 2: course builder + generator + lesson viewer

Week 3: export + coverage dashboard + polish

Week 4: pilot with 2 to 3 lecturers, gather feedback

Deliverable: a usable product with real content and measurable gaps.

Phase 10: Backlog for v2 (only after MVP works)

AI-assisted tagging of uploads

AI draft teacher notes from assets

Per-college customisation (add their own notes)

SCORM / VLE packaging

Analytics: most selected topics, lesson completion, time-on-lesson

Suggested deliverables list (what you can track internally)

Product spec (scope, roles, rules)

Database schema + ERD

Admin portal: topics, assets, templates

Upload conversion pipeline

Lecturer portal: course builder + generator

Lesson pack viewer

Export PDF

Coverage dashboard

Pilot content pack for one subject area


1) What you need to model
A) Hardware catalogue (Matrix products)

For each product or kit:

Product ID, name, short description

Category (PLC trainer, electrical fundamentals, robotics, sensors, etc.)

Capabilities tags (what it can teach or demonstrate)

Supported topics and outcomes (topic IDs and optionally outcome IDs)

Prerequisites (eg requires compressed air, requires 240 V, requires a PC, requires PLC)

Constraints (bench space, power, safety class, noise, consumables)

Included items and optional add-ons

Max learners per station (recommended)

Typical lesson activities supported (lab, demo, assessment)

Price band (not necessarily the actual price, could be internal tier)

Availability status

B) The generated course representation

When a lecturer generates a course, you already have:

List of topics, lesson count, lesson types (theory, lab, assessment)

Intended level and duration

Any selected delivery preferences (practical-heavy vs theory-heavy)

C) A mapping layer: topic and activity to hardware capability

Two practical ways:

Deterministic mapping (best for MVP)

Topic -> required capabilities -> matching hardware

Scoring model (later)

Course features -> compute match score across catalogue

Start with deterministic mapping plus a scoring layer for ranking.

2) How the recommendation logic works
Step 1: Extract “requirements” from the generated scheme

From the course you compute a requirements vector, for example:

Topic coverage weights: Ohm’s Law (high), series/parallel (high), measurement (medium)

Activity mix: 8 labs, 10 theory lessons, 2 assessments

Level: L3

Class constraints: 24 learners, 12 benches, 2 hours per week

Delivery environment constraints: no pneumatics, single phase only, limited storage

Some of these can be inferred, others set by the lecturer in a short “Teaching context” form.

Step 2: Hard filters (must meet)

Eliminate products that do not fit constraints:

Not compatible with power supply available

Needs pneumatics when they have none

Exceeds bench footprint

Wrong level range (if you enforce this)

Step 3: Score and rank the remaining products

Score components you can explain:

Coverage score: how many selected topics and outcomes does it support

Activity fit score: supports labs if course is practical-heavy

Capacity score: learners per station, how many stations needed

Completeness score: does it include measurement tools, safety features, worksheets

Expandability score: add-ons available that cover future topics

Value score: price tier vs coverage (if you track this)

Overall:

FinalScore = w1 Coverage + w2 ActivityFit + w3 Capacity + w4 Completeness + w5 Expandability + w6 Value

Keep weights simple and configurable by Matrix admin.

Step 4: Output recommendations as bundles, not single items

Lecturers buy setups, not just a box. Present:

Minimum viable setup

Recommended setup

Best-in-class setup

Each bundle includes:

Primary trainer(s)

Required ancillaries

Optional add-ons aligned to the selected topics

Station planning: “For 24 learners, you need 6 stations of X”

3) How it looks in the UI

After generating the scheme of work, the user sees a tab: Hardware to Deliver This Course

Each recommendation card shows:

Product name and picture

“Why recommended” with concrete matches:

Covers 18 of 22 selected topics

Supports 10 practical activities in your plan

Suitable for Level 3 and class size 24 (6 stations suggested)

Requirements it does not meet, if any:

“Does not cover topic: three-phase motor starters”

Setup requirements:

Power, space, PC needed, safety notes

Buttons:

View kit contents

Add to quote list

Compare

Comparison view:

Coverage heatmap by topic

Stations needed and estimated footprint

What extra add-ons are needed to reach 100 percent coverage

4) Data entry strategy for Matrix (so this is maintainable)

You do not want to manually link every topic to every product forever. Use capabilities as the middle layer.

Example:

Capability: “DC circuit measurement with DMM”

Capability: “Resistive networks and Ohm’s Law lab”

Capability: “PLC digital IO sequencing”

Capability: “Pneumatic actuation and solenoids”

Then you map:

Topic -> capabilities required or recommended

Product -> capabilities provided

This scales well.

5) Handling “lecturers know their route”

Same philosophy as your prerequisite stance:

Do not say “you must buy X”

Provide ranked options with reasons and editable assumptions

Let them toggle:

More practical

Lower cost

Minimal equipment

Expandable for next term

The system reacts by re-weighting scores and regenerating bundles.

6) A concrete example flow

Lecturer generates a 20-lesson plan for Electrical Fundamentals:

Topics include measurement, Ohm’s Law, series/parallel, power, basic protection

Mix includes 8 practical labs

System recommends:

Bundle A: “Electrical Fundamentals Bench Kit” x6 stations

Reason: covers measurement and DC circuit labs aligned to 8 practical lessons

Bundle B: Adds “Protection and switching add-on”

Reason: aligns to lessons on MCBs, isolation, fault finding (if included)

Bundle C: Adds “Intro PLC IO trainer” if the course includes control basics

Reason: aligns to switching logic and real-world control context

7) What to build first (MVP)

Build the capability tagging system (topic -> capabilities, product -> capabilities)

Collect 20 to 40 common capabilities that cover most training kits

Implement hard filters and a simple weighted score

Show 3 bundles with clear “why” text and a topic coverage bar chart

If you tell me which product families you want this to recommend first (eg Electrical Fundamentals, PLC Fundamentals, Smart Factory), I can draft:

a starter capability taxonomy,

example topic-to-capability mappings,

and a scoring rubric you can implement directly.