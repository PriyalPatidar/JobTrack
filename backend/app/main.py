from contextlib import asynccontextmanager
import os
from typing import Annotated

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, inspect, or_, select, text
from sqlalchemy.orm import Session

load_dotenv()

from .auth_routes import router as auth_router, get_current_user
from .database import Base, engine, get_db
from .models import Application, User
from .schemas import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationUpdate,
    ApplicationStatus,
)

Base.metadata.create_all(bind=engine)

with engine.begin() as conn:
    columns = {
        column["name"]
        for column in inspect(conn).get_columns("applications")
    }

    if "user_id" not in columns:
        conn.execute(
            text(
                "ALTER TABLE applications "
                "ADD COLUMN user_id INTEGER REFERENCES users(id)"
            )
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="JobTrack API",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(auth_router)

frontend_url = os.getenv("FRONTEND_URL", "")

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

if frontend_url:
    allowed_origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
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
    current_user: User = Depends(get_current_user),
    q: str | None = Query(default=None, max_length=120),
    status: ApplicationStatus | None = None,
):
    stmt = (
        select(Application)
        .where(Application.user_id == current_user.id)
        .order_by(
            Application.applied_date.desc(),
            Application.id.desc(),
        )
    )

    if q and q.strip():
        search = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Application.company.ilike(search),
                Application.role.ilike(search),
            )
        )

    if status is not None:
        stmt = stmt.where(Application.status == status)

    return db.scalars(stmt).all()


@app.get("/dashboard")
def dashboard(
    db: DbSession,
    current_user: User = Depends(get_current_user),
):
    user_filter = Application.user_id == current_user.id

    total = (
        db.scalar(
            select(func.count())
            .select_from(Application)
            .where(user_filter)
        )
        or 0
    )

    interviews = (
        db.scalar(
            select(func.count())
            .select_from(Application)
            .where(
                user_filter,
                Application.status == "Interview",
            )
        )
        or 0
    )

    offers = (
        db.scalar(
            select(func.count())
            .select_from(Application)
            .where(
                user_filter,
                Application.status == "Offer",
            )
        )
        or 0
    )

    pending = (
        db.scalar(
            select(func.count())
            .select_from(Application)
            .where(
                user_filter,
                Application.status.in_(
                    ["Applied", "Assessment", "Interview"]
                ),
            )
        )
        or 0
    )

    return {
        "total": total,
        "interviews": interviews,
        "offers": offers,
        "pending": pending,
    }


@app.post(
    "/applications",
    response_model=ApplicationOut,
    status_code=201,
)
def create_application(
    payload: ApplicationCreate,
    db: DbSession,
    current_user: User = Depends(get_current_user),
):
    application = Application(
        **payload.model_dump(),
        user_id=current_user.id,
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return application


@app.patch(
    "/applications/{application_id}",
    response_model=ApplicationOut,
)
def update_application(
    application_id: int,
    payload: ApplicationUpdate,
    db: DbSession,
    current_user: User = Depends(get_current_user),
):
    application = db.scalar(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    for field, value in payload.model_dump(
        exclude_unset=True
    ).items():
        setattr(application, field, value)

    db.commit()
    db.refresh(application)

    return application


@app.delete(
    "/applications/{application_id}",
    status_code=204,
)
def delete_application(
    application_id: int,
    db: DbSession,
    current_user: User = Depends(get_current_user),
):
    application = db.scalar(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    db.delete(application)
    db.commit()

    return Response(status_code=204)

    return Response(status_code=204)