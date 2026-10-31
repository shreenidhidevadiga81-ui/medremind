from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import require_roles
from ..security import hash_password

router = APIRouter(prefix="/nurses", tags=["Nurses"])
admin_only = require_roles("admin")


def get_nurse_or_404(db: Session, nurse_id: int) -> models.User:
    nurse = db.get(models.User, nurse_id)
    if nurse is None or nurse.role != "nurse":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Nurse not found")
    return nurse


@router.post("", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def create_nurse(
    data: schemas.NurseCreate,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(admin_only),
):
    taken = db.scalar(
        select(models.User).where(
            or_(models.User.username == data.username, models.User.phone == data.phone)
        )
    )
    if taken:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Username or phone number is already used")
    nurse = models.User(
        full_name=data.full_name,
        username=data.username,
        phone=data.phone,
        password_hash=hash_password(data.password),
        role="nurse",
        must_change_password=True,
    )
    db.add(nurse)
    db.commit()
    db.refresh(nurse)
    return nurse


@router.get("", response_model=list[schemas.UserOut])
def list_nurses(
    db: Session = Depends(get_db),
    _admin: models.User = Depends(admin_only),
):
    stmt = select(models.User).where(models.User.role == "nurse").order_by(models.User.full_name)
    return db.scalars(stmt).all()


@router.patch("/{nurse_id}", response_model=schemas.UserOut)
def update_nurse(
    nurse_id: int,
    data: schemas.NurseUpdate,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(admin_only),
):
    nurse = get_nurse_or_404(db, nurse_id)
    if data.phone and data.phone != nurse.phone:
        taken = db.scalar(select(models.User).where(models.User.phone == data.phone))
        if taken:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Phone number is already used")
        nurse.phone = data.phone
    if data.full_name is not None:
        nurse.full_name = data.full_name
    if data.is_active is not None:
        nurse.is_active = data.is_active
    db.commit()
    db.refresh(nurse)
    return nurse


@router.post("/{nurse_id}/reset-password")
def reset_nurse_password(
    nurse_id: int,
    data: schemas.ResetPasswordRequest,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(admin_only),
):
    nurse = get_nurse_or_404(db, nurse_id)
    nurse.password_hash = hash_password(data.new_password)
    nurse.must_change_password = True
    db.commit()
    return {"message": "Password reset. The nurse must change it at next login."}