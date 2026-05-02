# WafaDash — Django + React Dashboard

## Project Overview
A fleet/operations management dashboard with a Django REST API backend and React/Vite frontend. The app is in French/Arabic and manages interventions, fuel tracking (suivi carburant), invoices (factures), and user management.

## Architecture
- **Frontend**: React 18 + TypeScript + Vite (port 5000) — lives in `/front`
- **Backend**: Django 6 + Django REST Framework (port 8000) — lives in root directory
- **Database**: SQLite (`db.sqlite3`)
- **Auth**: JWT via `djangorestframework-simplejwt`

## Key Directories
- `/front/src/pages/userpa/` — User-facing pages (Login, Home, Operations, etc.)
- `/front/src/pages/adminpa/` — Admin pages
- `/USERS/` — Django app: models, views, serializers, URLs
- `/wafadash/` — Django project settings and root URLs
- `/factures_pdfs/` — Generated PDF invoices

## Workflows
- **Start application** — `cd front && npm run dev` on port 5000 (webview)
- **Backend API** — `python3 manage.py runserver localhost:8000 --noreload` on port 8000 (console)

## Dependencies
### Python
- django, djangorestframework, djangorestframework-simplejwt, django-cors-headers
- openpyxl, Pillow, pandas, reportlab
- xhtml2pdf (optional, import wrapped in try/except — needs cairo system libs)

### Node
- react, react-router-dom, axios, chart.js, recharts, tailwindcss, lucide-react, jspdf

## Notes
- `xhtml2pdf` requires `pycairo` which needs system cairo headers; import is guarded with try/except so PDF generation endpoints may fail gracefully
- CORS is set to allow all origins (`CORS_ALLOW_ALL_ORIGINS = True`) for dev
- `ALLOWED_HOSTS = ['*']` for Replit compatibility
- Vite proxies `/api` requests to `http://localhost:8000`
- Image assets (logos) are placeholder PNGs in `/front/src/pages/userpa/assets/` and `/front/src/pages/adminpa/assets/`
- Default admin: username=`admin`, password=`admin123`

## Custom User Model
`USERS.USER` extends `AbstractBaseUser` with an `age` field (nullable integer). The `AUTH_USER_MODEL` is set accordingly.
