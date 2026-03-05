# SoW Generator Platform

Production-ready front-end platform for building a Scheme of Work (SoW) from topic data, with no backend and no binary asset dependency.

The full platform runs from JSON files in this repo and is suitable for GitHub Pages.

## Core Capabilities

- Topic selection
- Lesson ordering (drag and drop)
- SoW generation
- In-app lesson content rendering (HTML/text from JSON)
- Hardware recommendations with class-size scaling

## Project Structure

- `index.html` - app shell
- `styles.css` - UI and print styles
- `app.js` - generator logic and rendering
- `admin.html` - no-code topic editor for `topics.json`
- `data/topics.json` - topic metadata and lesson block content
- `data/templates.json` - lesson block blueprint
- `data/hardware.json` - hardware mapping and scaling data
- `.github/workflows/deploy.yml` - GitHub Pages deploy workflow

## Local Run

Use a local web server so JSON fetch works.

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Content Editing Guide (JSON-Only)

Matrix content is managed by editing `data/topics.json`.

Each topic should include:

- `id`, `name`, `subject`, `domain`, `level`, `estimated_minutes`
- `hardware_tags` (array of capability tags)
- `content` object with:
- `outcomes_html`
- `explain_html`
- `practice_html`
- `assessment_html`

Example topic entry:

```json
{
  "id": "t_ohms_law",
  "name": "Ohm's Law",
  "subject": "Electrical Engineering",
  "domain": "Fundamentals",
  "level": "L3",
  "estimated_minutes": 60,
  "hardware_tags": ["dc_measurement", "resistive_networks"],
  "content": {
    "outcomes_html": "<p>Define voltage, current, and resistance.</p>",
    "explain_html": "<p>Teach V = I x R with one worked example.</p>",
    "practice_html": "<p>Complete 5 calculation questions.</p>",
    "assessment_html": "<p>Exit ticket with 3 mixed questions.</p>"
  }
}
```

Rules:

- Keep HTML simple (`<p>`, `<ul>`, `<li>`, `<strong>`).
- Keep block names and keys aligned with `data/templates.json`.
- If a block is missing, the app will show a placeholder warning.

## Admin Page Workflow (For Non-Developers)

1. Open `admin.html` in a browser (double-click).
2. Click `Load topics.json` and select the file from this repo.
3. Add, edit, or delete topics in the form.
4. Click `Save & Download` to export an updated `topics.json`.
5. Replace `data/topics.json` in the repo with the downloaded file.
6. A developer commits and pushes. GitHub Actions redeploys automatically.

What `admin.html` provides:
- Load existing JSON or start from scratch.
- Add/edit topic fields (name, subject, level, duration, hardware tags, all 4 content blocks).
- Expand/collapse topic cards for review.
- Delete with confirmation.
- Download a ready-to-use `topics.json`.

## GitHub Pages Deployment

1. Push to `main`.
2. In GitHub: `Settings -> Pages -> Source = GitHub Actions`.
3. Wait for workflow `Deploy to GitHub Pages` to complete.
4. Open the published Pages URL.

## Platform Roadmap

Future expansion can migrate content management to a backend CMS/database while keeping the same front-end workflow.
