from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import require_roles

router = APIRouter(tags=["Medicines"])
nurse_only = require_roles("nurse")
any_role = require_roles("nurse", "admin", "family")


def get_resident_or_404(db: Session, resident_id: int) -> models.Resident:
    resident = db.get(models.Resident, resident_id)
    if resident is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Resident not found")
    return resident


def make_doses_for_day(db: Session, day: date) -> None:
    """Create one dose row for every medicine time on this day (if missing)."""
    medicines = db.scalars(
        select(models.Medicine)
        .join(models.Resident, models.Resident.id == models.Medicine.resident_id)
        .where(
            models.Resident.status == "active",
            models.Medicine.is_active.is_(True),
            models.Medicine.start_date <= day,
            or_(models.Medicine.end_date.is_(None), models.Medicine.end_date >= day),
        )
    ).all()

    day_start = datetime.combine(day, time.min)
    day_end = day_start + timedelta(days=1)
    rows = db.execute(
        select(models.DoseLog.medicine_id, models.DoseLog.scheduled_for).where(
            models.DoseLog.scheduled_for >= day_start,
            models.DoseLog.scheduled_for < day_end,
        )
    ).all()
    existing = {(r[0], r[1]) for r in rows}

    for medicine in medicines:
        for t in medicine.times.split(","):
            hour, minute = map(int, t.split(":"))
            when = datetime.combine(day, time(hour, minute))
            if (medicine.id, when) not in existing:
                db.add(
                    models.DoseLog(
                        medicine_id=medicine.id,
                        resident_id=medicine.resident_id,
                        scheduled_for=when,
                    )
                )
    db.commit()


@router.post(
    "/residents/{resident_id}/medicines",
    response_model=schemas.MedicineOut,
    status_code=status.HTTP_201_CREATED,
)
def add_medicine(
    resident_id: int,
    data: schemas.MedicineCreate,
    db: Session = Depends(get_db),
    nurse: models.User = Depends(nurse_only),
):
    resident = get_resident_or_404(db, resident_id)
    if resident.allergies and data.name.strip().lower() in resident.allergies.lower():
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Warning: {resident.full_name} has a listed allergy that matches {data.name}",
        )
    start = data.start_date or date.today()
    if data.end_date and data.end_date < start:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "End date cannot be before start date")

    medicine = models.Medicine(
        resident_id=resident.id,
        name=data.name.strip(),
        dosage=data.dosage.strip(),
        times=",".join(data.times),
        instructions=data.instructions,
        start_date=start,
        end_date=data.end_date,
        created_by_id=nurse.id,
    )
    db.add(medicine)
    db.commit()
    db.refresh(medicine)
    make_doses_for_day(db, date.today())  # so today's doses appear straight away
    return medicine


@router.get("/residents/{resident_id}/medicines", response_model=list[schemas.MedicineOut])
def list_medicines(
    resident_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(any_role),
):
    resident = get_resident_or_404(db, resident_id)
    if user.role == "family" and resident.family_user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only view your own relative")
    stmt = (
        select(models.Medicine)
        .where(models.Medicine.resident_id == resident_id)
        .order_by(models.Medicine.is_active.desc(), models.Medicine.name)
    )
    return db.scalars(stmt).all()


@router.post("/medicines/{medicine_id}/stop", response_model=schemas.MedicineOut)
def stop_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    _nurse: models.User = Depends(nurse_only),
):
    medicine = db.get(models.Medicine, medicine_id)
    if medicine is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Medicine not found")
    medicine.is_active = False
    # remove upcoming doses that nobody has marked yet
    db.execute(
        delete(models.DoseLog).where(
            models.DoseLog.medicine_id == medicine_id,
            models.DoseLog.status == "pending",
            models.DoseLog.scheduled_for > datetime.now(),
        )
    )
    db.commit()
    db.refresh(medicine)
    return medicine


@router.get("/doses/today", response_model=list[schemas.DoseOut])
def todays_doses(
    db: Session = Depends(get_db),
    user: models.User = Depends(any_role),
):
    today = date.today()
    make_doses_for_day(db, today)
    day_start = datetime.combine(today, time.min)
    day_end = day_start + timedelta(days=1)

    stmt = (
        select(models.DoseLog, models.Medicine, models.Resident)
        .join(models.Medicine, models.Medicine.id == models.DoseLog.medicine_id)
        .join(models.Resident, models.Resident.id == models.DoseLog.resident_id)
        .where(
            models.DoseLog.scheduled_for >= day_start,
            models.DoseLog.scheduled_for < day_end,
        )
        .order_by(models.DoseLog.scheduled_for, models.Resident.full_name)
    )
    if user.role == "family":
        stmt = stmt.where(models.Resident.family_user_id == user.id)

    result = []
    for dose, medicine, resident in db.execute(stmt).all():
        item = schemas.DoseOut.model_validate(dose)
        item.medicine_name = medicine.name
        item.dosage = medicine.dosage
        item.resident_name = resident.full_name
        result.append(item)
    return result


@router.post("/doses/{dose_id}/mark", response_model=schemas.DoseOut)
def mark_dose(
    dose_id: int,
    data: schemas.DoseUpdate,
    db: Session = Depends(get_db),
    nurse: models.User = Depends(nurse_only),
):
    dose = db.get(models.DoseLog, dose_id)
    if dose is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Dose not found")
    if dose.status != "pending":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"This dose is already marked {dose.status}")
    dose.status = data.status
    dose.given_by_id = nurse.id
    dose.given_at = datetime.now()
    dose.note = data.note
    db.commit()
    db.refresh(dose)

    item = schemas.DoseOut.model_validate(dose)
    medicine = db.get(models.Medicine, dose.medicine_id)
    resident = db.get(models.Resident, dose.resident_id)
    item.medicine_name = medicine.name
    item.dosage = medicine.dosage
    item.resident_name = resident.full_name
    return item