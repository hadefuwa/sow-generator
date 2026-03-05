# SoW Generator Pilot

Static proof-of-concept for generating a Scheme of Work and hardware recommendations.

## Local run
Open `index.html` in a local web server (recommended) so JSON fetch works.

Example with PowerShell:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## GitHub Pages
This repo includes `.github/workflows/deploy.yml`.

To publish:
1. Push to `main`
2. In GitHub: Settings -> Pages -> Source = GitHub Actions
3. Wait for workflow `Deploy to GitHub Pages` to finish
