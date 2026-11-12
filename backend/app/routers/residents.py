from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import require_roles
from ..security import hash_password

router = APIRouter(prefix="/residents", tags=["Residents"])
nurse_only = require_roles("nurse")
any_staff_or_family = require_roles("nurse", "admin", "family")


def get_resident_or_404(db: Session, resident_id: int) -> models.Resident:
    resident = db.get(models.Resident, resident_id)
    if resident is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Resident not found")
    return resident


def next_resident_number(db: Session) -> str:
    highest = db.scalar(select(func.max(models.Resident.id))) or 0
    return f"R-{highest + 1:03d}"


@router.post("", response_model=schemas.ResidentOut, status_code=status.HTTP_201_CREATED)
def create_resident(
    data: schemas.ResidentCreate,
    db: Session = Depends(get_db),
    nurse: models.User = Depends(nurse_only),
):
    family_user = None
    family_fields = [
        data.family_full_name,
        data.family_username,
        data.family_phone,
        data.family_password,
    ]
    if any(family_fields):
        if not all(family_fields):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "To create a family login, fill in family name, username, phone and password",
            )
        taken = db.scalar(
            select(models.User).where(
                or_(
                    models.User.username == data.family_username,
                    models.User.phone == data.family_phone,
                )
            )
        )
        if taken:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, "Family username or phone number is already used"
            )
        family_user = models.User(
            full_name=data.family_full_name,
            username=data.family_username,
            phone=data.family_phone,
            password_hash=hash_password(data.family_password),
            role="family",
            must_change_password=True,
        )
        db.add(family_user)
        db.flush()  # gives family_user an id before we save the resident

    resident = models.Resident(
        resident_number=next_resident_number(db),
        full_name=data.full_name,
        id_number=data.id_number,
        age=data.age,
        gender=data.gender,
        room=data.room,
        medical_conditions=data.medical_conditions,
        allergies=data.allergies,
        contact_number=data.contact_number,
        assigned_nurse_id=nurse.id,
        family_user_id=family_user.id if family_user else None,
    )
    db.add(resident)
    db.commit()
    db.refresh(resident)
    return resident


@router.get("", response_model=list[schemas.ResidentOut])
def list_residents(
    search: str | None = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(any_staff_or_family),
):
    stmt = select(models.Resident).order_by(models.Resident.full_name)
    if user.role == "family":
        stmt = stmt.where(models.Resident.family_user_id == user.id)
    if search:
        like = f"%{search}%"
        stmt = stmt.where(
            or_(
                models.Resident.full_name.ilike(like),
                models.Resident.resident_number.ilike(like),
                models.Resident.id_number.ilike(like),
            )
        )
    return db.scalars(stmt).all()


@router.get("/{resident_id}", response_model=schemas.ResidentOut)
def get_resident(
    resident_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(any_staff_or_family),
):
    resident = get_resident_or_404(db, resident_id)
    if user.role == "family" and resident.family_user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only view your own relative")
    return resident