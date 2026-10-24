from datetime import date, datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, HttpUrl

ApplicationStatus = Literal["Applied", "Assessment", "Interview", "Offer", "Rejected"]


class ApplicationCreate(BaseModel):
    company: str = Field(min_length=1, max_length=120)
    role: str = Field(min_length=1, max_length=120)
    status: ApplicationStatus = "Applied"
    applied_date: date = Field(default_factory=date.today)
    deadline: date | None = None
    interview_date: date | None = None
    job_url: str | None = Field(default=None, max_length=500)
    notes: str | None = None


class ApplicationUpdate(BaseModel):
    company: str | None = Field(default=None, min_length=1, max_length=120)
    role: str | None = Field(default=None, min_length=1, max_length=120)
    status: ApplicationStatus | None = None
    applied_date: date | None = None
    deadline: date | None = None
    interview_date: date | None = None
    job_url: str | None = Field(default=None, max_length=500)
    notes: str | None = None


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company: str
    role: str
    status: ApplicationStatus
    applied_date: date
    deadline: date | None
    interview_date: date | None
    job_url: str | None
    notes: str | None
    created_at: datetime | None = None
