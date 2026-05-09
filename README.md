# OneRoom Contract Builder Webapp

OneRoom Contract Builder is a static, browser-based tool for preparing tenant contract data.

It is designed for GitHub Pages and runs with no backend.

## What It Does

- Import tenant rows from CSV or JSON
- Edit and review rows in a table UI
- Save landlord profiles in browser storage
- Apply landlord values to all rows
- Auto-fill date fields
- Use a built-in standard DOCX template (no manual upload flow)
- Copy placeholder tokens for document templates
- Export cleaned CSV or JSON

## Tech Stack

- HTML, CSS, vanilla JavaScript
- Static hosting from the docs folder
- GitHub Actions workflow for Pages deployment

## Project Structure

- docs/index.html: app entry page
- docs/assets/style.css: UI styles
- docs/assets/app.js: app logic
- docs/templates/: place standard DOCX template here
- .github/workflows/deploy-pages.yml: GitHub Pages deployment workflow

## Standard Template Setup

To use a built-in template without manual upload, place your DOCX file at:

docs/templates/Tenancy Agreement New.docx

After that, the app shows an enabled "Download Standard DOCX Template" button in the Standard Template section.

## Quick Start (Local)

Run a local static server from the repository root.

```powershell
python -m http.server 8080 --directory docs
```

Open:

http://127.0.0.1:8080

Alternative:

```powershell
npx serve docs
```

## Deploy to GitHub Pages

1. Push changes to main.
2. In GitHub repository settings, open Pages.
3. Set Source to GitHub Actions.
4. Wait for the Deploy GitHub Pages workflow to complete.

Published URL format:

https://<your-github-username>.github.io/<repository-name>/

## Data Format

### Supported import formats

- CSV with a header row
- JSON array of objects

### Common fields

- tenant_1_name
- tenant_1_email
- tenant_1_phone
- tenant_2_name
- property_address
- room_name
- commencement_date
- end_date
- rent_expected
- landlord_name
- landlord_telephone_number
- landlord_email_address

Any additional columns are preserved and included in export.

## Privacy and Storage

- Data is stored in browser localStorage on the device being used.
- No server-side processing is used.
- No credentials are transmitted by this app.

## Limitations

- This is a static web app. It does not scrape OneRoom directly.
- It does not include server-side PDF or DOCX generation.
- It does not include backend databases or background jobs.

## License and Use

Use internally or adapt to your workflow as needed.
