# SoW Generator Platform

Production-ready platform for building a Scheme of Work (SoW) from topic data, with a lightweight Node backend for live data reads/writes.

The full platform runs from JSON files in this repo and is suitable for GitHub Pages.

## Core Capabilities

- Topic selection
- Lesson ordering (drag and drop)
- SoW generation
- In-app lesson content rendering (HTML/text from JSON)
- Hardware recommendations with class-size scaling

## Project Structure

- `server.js` - Railway-ready backend (static hosting + `/api/*` routes)
- `index.html` - app shell
- `styles.css` - UI and print styles
- `app.js` - generator logic and rendering
- `admin.html` - Topic Editor for `topics.json`
- `hardware.html` - Hardware Editor for `hardware.json`
- `data/topics.json` - topic metadata and lesson block content
- `data/templates.json` - lesson block blueprint
- `data/hardware.json` - hardware mapping and scaling data
- `.github/workflows/deploy.yml` - GitHub Pages deploy workflow

## Local Run

```powershell
npm install
npm start
```

Then open `http://localhost:3000`.

## Backend API

- `GET /api/topics`
- `PUT /api/topics` (requires staff token)
- `GET /api/hardware`
- `PUT /api/hardware` (requires staff token)
- `GET /api/templates`
- `POST /api/upload-image` (requires staff token, JPG/PNG only, max 1 MB)
- `GET /api/health`

Write endpoints require header `x-admin-token: <ADMIN_TOKEN>`.

Environment variables:

- `PORT` (provided by Railway)
- `ADMIN_TOKEN` (required for Topic/Hardware Editor saves)
- `DATA_DIR` (optional path for JSON storage; for Railway persistent volume use `/data`)
- `IMAGE_UPLOAD_DIR` (optional path for uploaded topic images; for Railway persistent volume use a mounted path such as `/data/uploads`)

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

## Topic Editor Workflow (For Non-Developers)

1. Open `admin.html` in a browser (double-click).
2. Add, edit, or delete topics in the form.
3. Click `Save Changes` and enter Matrix staff token.
4. Replace `data/topics.json` in the repo with the downloaded file.
5. A developer commits and pushes. GitHub Actions redeploys automatically.

What `admin.html` provides:
- Add/edit topic fields (name, subject, level, duration, hardware tags, all 4 content blocks).
- Upload a lesson image from the admin page and store the returned server path in the topic.
- Expand/collapse topic cards for review.
- Delete with confirmation.
- Download a ready-to-use `topics.json`.

Railway note:
- Uploaded images only survive restarts/redeploys if `IMAGE_UPLOAD_DIR` points to persistent storage. If it uses the container filesystem, uploads are temporary.

## Hardware Editor Workflow (For Non-Developers)

1. Open `hardware.html` in a browser (double-click).
2. Add, edit, or delete hardware items in the form.
3. Click `Save Changes` and enter Matrix staff token.
4. Replace `data/hardware.json` in the repo with the downloaded file.

## GitHub Pages Deployment

1. Push to `main`.
2. In GitHub: `Settings -> Pages -> Source = GitHub Actions`.
3. Wait for workflow `Deploy to GitHub Pages` to complete.
4. Open the published Pages URL.

## Platform Roadmap

Future expansion can migrate content management to a backend CMS/database while keeping the same front-end workflow.
