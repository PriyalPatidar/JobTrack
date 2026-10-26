# JobTrack — Job Application Tracker

JobTrack is a web application that helps users manage and track their job applications in one place.

## Features

- User registration and login
- JWT-based authentication
- Add, view, update, and delete job applications
- Track application statuses such as Applied and Interview
- Dashboard showing application statistics
- Store and manage application deadlines
- Protected API endpoints

## Tech Stack

**Frontend**
- React
- Vite
- JavaScript
- CSS

**Backend**
- Python
- FastAPI
- SQLAlchemy
- JWT authentication
- Password hashing

**Database**
- SQLite

## Project Structure

```text
JobTrack/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── database.py
│   │   ├── auth.py
│   │   ├── auth_routes.py
│   │   └── auth_schemas.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   └── Auth.jsx
    └── package.json
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/PriyalPatidar/JobTrack.git
cd JobTrack
```

### 2. Set up the backend

Create and activate a Python virtual environment inside the `backend` folder.

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

Set a secure `JWT_SECRET_KEY` environment variable before starting the backend. Keep the secret private and never commit it to GitHub.

Start the backend from the project root:

```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Open the API documentation at:

http://127.0.0.1:8001/docs

### 3. Set up the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local frontend URL shown in the terminal.

## How It Works

1. Users register and log in to their accounts.
2. The frontend sends API requests to the FastAPI backend.
3. The backend validates authentication and processes requests.
4. Application information is stored in the database.
5. The dashboard displays application information and statistics.

## Learning Outcomes

- Building a frontend with React
- Creating REST APIs using FastAPI
- Implementing authentication and password hashing
- Working with a relational database
- Connecting frontend and backend
- Using Git and GitHub for version control

## Future Improvements

- Application status charts and analytics
- Improved deadline reminders
- Advanced filtering and sorting
- Deployment to a hosting platform

## Author

**Priyal Patidar**

GitHub: https://github.com/PriyalPatidar
