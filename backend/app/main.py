from contextlib import asynccontextmanager
from datetime import date
from typing import Annotated
import os

from fastapi import Depends, FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import Application
from .schemas import ApplicationCreate, ApplicationOut, ApplicationUpdate

Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Tables are created above for a simple beginner setup.
    yield


app = FastAPI(title="JobTrack API", version="0.1.0", lifespan=lifespan)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

frontend_url = os.getenv("FRONTEND_URL", "")

allowed_origins = [
    "http://localhost:5175",
    "http://127.0.0.1:5175",
]

if frontend_url:
    allowed_origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


DbSession = Annotated[Session, Depends(get_db)]


@app.get("/")
def health_check():
    return {"message": "JobTrack API is running"}


@app.get("/applications", response_model=list[ApplicationOut])
def list_applications(
    db: DbSession,
    q: str | None = Query(default=None, max_length=120),
    status: str | None = None,
):
    stmt = select(Application).order_by(Application.applied_date.desc(), Application.id.desc())
    if q:
        search = f"%{q.strip()}%"
        stmt = stmt.where(or_(Application.company.ilike(search), Application.role.ilike(search)))
    if status:
        stmt = stmt.where(Application.status == status)
    return db.scalars(stmt).all()


@app.get("/dashboard")
def dashboard(db: DbSession):
    total = db.scalar(select(func.count()).select_from(Application)) or 0
    interviews = db.scalar(
        select(func.count()).select_from(Application).where(Application.status == "Interview")
    ) or 0
    offers = db.scalar(
        select(func.count()).select_from(Application).where(Application.status == "Offer")
    ) or 0
    pending = db.scalar(
        select(func.count()).select_from(Application).where(
            Application.status.in_(["Applied", "Assessment", "Interview"])
        )
    ) or 0
    return {"total": total, "interviews": interviews, "offers": offers, "pending": pending}


@app.post("/applications", response_model=ApplicationOut, status_code=201)
def create_application(payload: ApplicationCreate, db: DbSession):
    application = Application(**payload.model_dump())
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@app.patch("/applications/{application_id}", response_model=ApplicationOut)
def update_application(application_id: int, payload: ApplicationUpdate, db: DbSession):
    application = db.get(Application, application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(application, field, value)
    db.commit()
    db.refresh(application)
    return application


@app.delete("/applications/{application_id}", status_code=204)
def delete_application(application_id: int, db: DbSession):
    application = db.get(Application, application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(application)
    db.commit()
    return Response(status_code=204)
