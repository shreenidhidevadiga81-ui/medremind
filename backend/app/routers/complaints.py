from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..deps import require_roles

router = APIRouter(prefix="/complaints", tags=["complaints"])

MAX_PER_DAY = 5


class ComplaintCreate(BaseModel):
    message: str = Field(min_length=1, max_length=500)


class StatusUpdate(BaseModel):
    status: str


def complaint_to_dict(c: models.Complaint, family_name=None, resident_name=None):
    return {
        "id": c.id,
        "message": c.message,
        "status": c.status,
        "created_at": c.created_at.isoformat(),
        "family_name": family_name,
        "resident_name": resident_name,
    }


@router.post("")
def send_complaint(
    data: ComplaintCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_roles("family")),
):
    message = data.message.strip()
    if not message:
        raise HTTPException(400, "Please write a message")

    start_of_day = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0, tzinfo=None
    )
    sent_today = db.scalar(
        select(func.count(models.Complaint.id)).where(
            models.Complaint.family_user_id == user.id,
            models.Complaint.created_at >= start_of_day,
        )
    )
    if sent_today >= MAX_PER_DAY:
        raise HTTPException(
            400, f"You can send only {MAX_PER_DAY} messages per day. Please try tomorrow."
        )

    resident = db.scalar(
        select(models.Resident).where(models.Resident.family_user_id == user.id)
    )
    complaint = models.Complaint(
        family_user_id=user.id,
        resident_id=resident.id if resident else None,
        message=message,
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint_to_dict(complaint, user.full_name, resident.full_name if resident else None)


@router.get("/mine")
def my_complaints(
    db: Session = Depends(get_db),
    user: models.User = Depends(require_roles("family")),
):
    rows = db.scalars(
        select(models.Complaint)
        .where(models.Complaint.family_user_id == user.id)
        .order_by(models.Complaint.created_at.desc())
    ).all()
    return [complaint_to_dict(c, user.full_name) for c in rows]


@router.get("")
def list_complaints(
    db: Session = Depends(get_db),
    user: models.User = Depends(require_roles("admin")),
):
    rows = db.execute(
        select(models.Complaint, models.User.full_name, models.Resident.full_name)
        .join(models.User, models.User.id == models.Complaint.family_user_id)
        .outerjoin(models.Resident, models.Resident.id == models.Complaint.resident_id)
        .order_by(models.Complaint.created_at.desc())
    ).all()
    return [complaint_to_dict(c, fam, res) for c, fam, res in rows]


@router.post("/{complaint_id}/status")
def update_status(
    complaint_id: int,
    data: StatusUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_roles("admin")),
):
    if data.status not in ("seen", "resolved"):
        raise HTTPException(400, "Status must be 'seen' or 'resolved'")
    complaint = db.get(models.Complaint, complaint_id)
    if complaint is None:
        raise HTTPException(404, "Complaint not found")
    complaint.status = data.status
    complaint.updated_at = models.now()
    db.commit()
    db.refresh(complaint)
    return complaint_to_dict(complaint)