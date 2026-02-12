# School Lost-and-Found Website

This project includes two ways to run the site:

1) Dynamic FastAPI app (server) — implementation.
2) Static Single-Page App (SPA) for Live Server — open `index.html` with Live Server.


Live Server (recommended for quick demo):
- In VS Code open this workspace and right-click `index.html` → "Open with Live Server".
- The SPA stores data locally in your browser (localStorage) and supports:
	- Reporting found items (with photo uploads saved as data URLs)
	- Searching approved items
	- Claim/inquiry form per item
	- Admin dashboard (password: `secret`) to approve/delete items and view claims

Notes:
- The static SPA is a client-side demo only — data is stored per-browser. For a multi-user site, use the FastAPI app and host it on a server.

Project structure (key files):
- Frontend pages: `index.html` and templates in `html/`
- Styling: `static/css/site.css`
- Client logic (SPA routing, admin tools, help page): `static/js/site.js`
- Backend API: `main.py`
- Documentation for judges: `JUDGES.md`

For judges and reviewers: see `JUDGES.md` for a concise explanation of features, how to run the server, API endpoints, and accessibility improvements.
Sources and professional references are listed in `SOURCES.md`.

Adding school photos and graphics
- To use your Pensacola High School photos in the demo gallery or hero, place image files in `static/assets/` (for example `static/assets/sample1.jpg`).
- After adding images, open the SPA and click "Seed demo items" on the home page (appears when no items exist). The seeded demo items reference `static/assets/sample1.jpg` and `sample2.jpg`.
- You can also upload images directly from the "Report Found Item" form; those uploads are saved to the browser's localStorage as data URLs.

Running the FastAPI server (optional):
```powershell
python -m venv venv
venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```
