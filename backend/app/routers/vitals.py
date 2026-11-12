from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import require_roles

router = APIRouter(tags=["Vitals"])
nurse_only = require_roles("nurse")
any_role = require_roles("nurse", "admin", "family")


def check_critical(data: schemas.VitalCreate) -> list[str]:
    """Return a list of reasons why this reading is critical (empty means normal)."""
    reasons = []
    if data.systolic is not None:
        if data.systolic < 90:
            reasons.append(f"Low BP (top number {data.systolic})")
        elif data.systolic > 180:
            reasons.append(f"High BP (top number {data.systolic})")
    if data.diastolic is not None:
        if data.diastolic < 50:
            reasons.append(f"Low BP (bottom number {data.diastolic})")
        elif data.diastolic > 120:
            reasons.append(f"High BP (bottom number {data.diastolic})")
    if data.sugar is not None:
        if data.sugar < 70:
            reasons.append(f"Low sugar ({data.sugar} mg/dL)")
        elif data.sugar > 300:
            reasons.append(f"High sugar ({data.sugar} mg/dL)")
    if data.oxygen is not None and data.oxygen < 92:
        reasons.append(f"Low oxygen ({data.oxygen}%)")
    return reasons


def get_resident_or_404(db: Session, resident_id: int) -> models.Resident:
    resident = db.get(models.Resident, resident_id)
    if resident is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Resident not found")
    return resident


@router.post(
    "/residents/{resident_id}/vitals",
    response_model=schemas.VitalOut,
    status_code=status.HTTP_201_CREATED,
)
def record_vitals(
    resident_id: int,
    data: schemas.VitalCreate,
    db: Session = Depends(get_db),
    nurse: models.User = Depends(nurse_only),
):
    get_resident_or_404(db, resident_id)
    if all(v is None for v in (data.systolic, data.diastolic, data.sugar, data.oxygen)):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Enter at least one reading")
    if (data.systolic is None) != (data.diastolic is None):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Enter both BP numbers (top and bottom), or neither"
        )
    if data.systolic is not None and data.diastolic is not None and data.systolic <= data.diastolic:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "The top BP number must be higher than the bottom number"
        )

    reasons = check_critical(data)
    vital = models.Vital(
        resident_id=resident_id,
        systolic=data.systolic,
        diastolic=data.diastolic,
        sugar=data.sugar,
        oxygen=data.oxygen,
        is_critical=bool(reasons),
        critical_reason="; ".join(reasons) if reasons else None,
        recorded_by_id=nurse.id,
    )
    db.add(vital)
    db.commit()
    db.refresh(vital)
    return vital


@router.get("/residents/{resident_id}/vitals", response_model=list[schemas.VitalOut])
def list_vitals(
    resident_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(any_role),
):
    resident = get_resident_or_404(db, resident_id)
    if user.role == "family" and resident.family_user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only view your own relative")
    stmt = (
        select(models.Vital)
        .where(models.Vital.resident_id == resident_id)
        .order_by(models.Vital.recorded_at.desc())
        .limit(30)
    )
    return db.scalars(stmt).all()


@router.get("/vitals/critical", response_model=list[schemas.VitalOut])
def recent_critical(
    db: Session = Depends(get_db),
    _user: models.User = Depends(require_roles("nurse", "admin")),
):
    """Critical readings from the last 24 hours (for the admin dashboard)."""
    since = datetime.utcnow() - timedelta(hours=24)
    stmt = (
        select(models.Vital)
        .where(models.Vital.is_critical.is_(True), models.Vital.recorded_at >= since)
        .order_by(models.Vital.recorded_at.desc())
    )
    return db.scalars(stmt).all()