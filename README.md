# JobTrack — Smart Job Application Tracker

A beginner-friendly full-stack starter project for tracking job applications.

## Tech stack
- Frontend: React + Vite
- Backend: Python + FastAPI
- Database: PostgreSQL
- Local database: Docker Compose (optional)
- Git/GitHub: version control

## Features in this starter
- Dashboard counts: total applications, interviews, offers
- Add and list job applications
- Update application status
- Delete an application
- Search/filter by company and status
- PostgreSQL persistence (or SQLite fallback for easy first run)

## Project structure
```text
JobTrack/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       └── style.css
├── docker-compose.yml
└── .gitignore
```

## Before starting
Install:
1. Python 3.11 or newer
2. Node.js LTS (includes npm)
3. VS Code
4. Git
5. Docker Desktop only if you want PostgreSQL via Docker

Check in VS Code terminal:
```bash
python --version
node --version
npm --version
git --version
```

## Run the backend (easy first run with SQLite)
Open a terminal in the `backend` folder:
```bash
python -m venv .venv
```
Windows PowerShell:
```powershell
.\.venv\Scripts\Activate.ps1
```
If PowerShell blocks activation, use Command Prompt and run:
```bat
.venv\Scripts\activate.bat
```
Then:
```bash
pip install -r requirements.txt
```
Copy `.env.example` to `.env` if you want to configure settings. The default uses a local SQLite file, so you do not need Docker for the first run.
```bash
uvicorn app.main:app --reload
```
Open:
- API docs: http://127.0.0.1:8000/docs
- API health: http://127.0.0.1:8000/

## Run the frontend
Open a second terminal in the `frontend` folder:
```bash
npm install
npm run dev
```
Open the local URL printed by Vite, usually http://localhost:5173.

## Use PostgreSQL (optional)
Start Docker Desktop, then from the project root:
```bash
docker compose up -d
```
Set `DATABASE_URL` in `backend/.env` to:
```env
DATABASE_URL=postgresql+psycopg://jobtrack:jobtrack_dev_password@localhost:5432/jobtrack
```
Restart the backend. For local learning, the default SQLite setup is simpler. Do not use the sample password in a public deployment.

## API endpoints
- `GET /` — health check
- `GET /applications` — list applications; optional `q` and `status` filters
- `GET /dashboard` — dashboard summary counts
- `POST /applications` — create an application
- `PATCH /applications/{id}` — update an application's fields/status
- `DELETE /applications/{id}` — delete an application

## First milestone
1. Start the backend.
2. Open `/docs` and add a sample application.
3. Start the frontend and verify it appears in the list.
4. Then customize the UI and add reminders, login, tests, and deployment.

## Important
This is a starter scaffold, not a production-ready system. Authentication, authorization, migrations, automated tests, and production deployment hardening are not included yet. We will add those step by step.
