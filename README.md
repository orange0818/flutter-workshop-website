# Flutter Workshop Website

Landing page for the TSEC Flutter Mobile App Development Workshop (8–13 May 2026).

## Project structure

```
├── index.html          # Built output (open this in a browser or deploy)
├── index.template.html # HTML shell with section includes
├── style.css           # Custom styles
├── script.js           # Interactions and animations
├── build.mjs           # Merges template + sections → index.html
├── sections/           # One file per page section (edit these)
├── assets/
│   ├── logos/          # TSEC & TPC logos
│   ├── images/         # Photos (e.g. trainer.png)
│   └── icons/          # Optional icon assets
└── scripts/            # Setup & extract utilities
```

## Editing content

1. Change the relevant file under `sections/` (e.g. `sections/timeline.html` for schedule).
2. Update `style.css` or `script.js` if needed.
3. Run the build:

```bash
node build.mjs
```

4. Refresh the browser (hard refresh if cached).

## Local preview

Use any static file server so paths resolve correctly:

```bash
npx --yes serve .
```

Then open the URL shown (usually http://localhost:3000).

## Registration form

Update the Google Form URL in `script.js` (`FORM_URL`). All `.register-link` and `.float-register` buttons use that value.

## Logos

Place updated logos in `assets/logos/` as `tsec.webp` and `tpc.png`. Original uploads can stay in `assets/`; run `node scripts/setup-assets.mjs` to copy them into `assets/logos/`.

## Share with college IT (hosting on their website)

This is a **static website** (HTML + CSS + JS + images). No database or server-side code is required. Any normal web host can serve it.

### Step 1 — Prepare the files to send

1. Run `node build.mjs` so `index.html` is up to date.
2. Zip the following (keep this folder structure inside the zip):

| Include | Notes |
|---------|--------|
| `index.html` | Main page |
| `style.css` | Styles |
| `script.js` | Scripts |
| `assets/` | **Entire folder** (logos, trainer photo, etc.) |

You do **not** need to send `sections/`, `build.mjs`, or `node_modules` unless IT wants to edit the site later.

### Step 2 — How the college can host it

Ask IT to choose **one** of these (most colleges already use option A or B):

**A. Subfolder on the college site (most common)**  
Example URL: `https://www.tsecmumbai.in/flutter-workshop/`  
- Upload the zip contents into a folder named e.g. `flutter-workshop` on the college web server (cPanel, FTP, or internal CMS).
- All files must stay in the same folder so links like `style.css` and `assets/logos/tsec.webp` work.

**B. Subdomain**  
Example: `https://flutter-workshop.tsecmumbai.in`  
- IT points a subdomain to a folder with the same files as above.

**C. Free static hosting (if college has no slot)**  
- [GitHub Pages](https://pages.github.com), [Netlify Drop](https://app.netlify.com/drop), or [Cloudflare Pages](https://pages.cloudflare.com) — upload the zip or connect a Git repo. IT or TPC can own the account.

### Step 3 — What to tell IT in one email

> Please host this static workshop landing page. Upload the attached zip to a path such as `/flutter-workshop/` on our domain. Requirements: no PHP/database; only HTML/CSS/JS. Ensure the `assets` folder is uploaded with the same structure. Optional: force HTTPS and cache static files for performance.

### Step 4 — Collaborate with teammates (optional)

- Push the project to **GitHub** and add collaborators under **Settings → Collaborators**.
- Teammates edit `sections/`, run `node build.mjs`, and open a pull request.
- For production, either IT pulls from GitHub or you send an updated zip after each build.

### Checklist after go-live

- [ ] Home page loads with styles (not plain HTML).
- [ ] TSEC and TPC logos appear in the header.
- [ ] “Register” buttons open the Google Form.
- [ ] Page works on mobile.

## Deploy (quick)

Deploy the project root: `index.html`, `style.css`, `script.js`, and the full `assets/` folder. Run `node build.mjs` before zipping or uploading.
