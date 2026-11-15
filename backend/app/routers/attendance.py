from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..deps import require_roles

router = APIRouter(prefix="/attendance", tags=["attendance"])


def row_to_dict(a: models.Attendance | None):
    if a is None:
        return None
    return {
        "id": a.id,
        "day": a.day.isoformat(),
        "status": a.status,
        "check_in": a.check_in.isoformat() if a.check_in else None,
        "check_out": a.check_out.isoformat() if a.check_out else None,
        "note": a.note,
    }


def get_today_row(db: Session, nurse_id: int):
    return db.scalar(
        select(models.Attendance).where(
            models.Attendance.nurse_id == nurse_id,
            models.Attendance.day == date.today(),
        )
    )


@router.get("/me/today")
def my_today(
    db: Session = Depends(get_db),
    user: models.User = Depends(require_roles("nurse")),
):
    return row_to_dict(get_today_row(db, user.id))


@router.post("/check-in")
def check_in(
    db: Session = Depends(get_db),
    user: models.User = Depends(require_roles("nurse")),
):
    row = get_today_row(db, user.id)
    if row and row.status == "leave":
        raise HTTPException(400, "You are marked on leave today")
    if row and row.check_in:
        raise HTTPException(400, "You have already checked in today")
    row = models.Attendance(
        nurse_id=user.id,
        day=date.today(),
        status="present",
        check_in=models.now(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row_to_dict(row)


@router.post("/check-out")
def check_out(
    db: Session = Depends(get_db),
    user: models.User = Depends(require_roles("nurse")),
):
    row = get_today_row(db, user.id)
    if row is None or row.check_in is None:
        raise HTTPException(400, "You have not checked in today")
    if row.check_out:
        raise HTTPException(400, "You have already checked out today")
    row.check_out = models.now()
    db.commit()
    db.refresh(row)
    return row_to_dict(row)


@router.post("/leave")
def mark_leave(
    db: Session = Depends(get_db),
    user: models.User = Depends(require_roles("nurse")),
):
    row = get_today_row(db, user.id)
    if row and row.check_in:
        raise HTTPException(400, "You already checked in today")
    if row is None:
        row = models.Attendance(nurse_id=user.id, day=date.today(), status="leave")
        db.add(row)
    else:
        row.status = "leave"
    db.commit()
    db.refresh(row)
    return row_to_dict(row)


@router.get("")
def list_attendance(
    day: date | None = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_roles("admin")),
):
    day = day or date.today()
    nurses = db.scalars(
        select(models.User)
        .where(models.User.role == "nurse", models.User.is_active == True)
        .order_by(models.User.full_name)
    ).all()
    rows = db.scalars(
        select(models.Attendance).where(models.Attendance.day == day)
    ).all()
    by_nurse = {r.nurse_id: r for r in rows}

    result = []
    for n in nurses:
        r = by_nurse.get(n.id)
        if r is None:
            state = "not_checked_in"
        elif r.status == "leave":
            state = "on_leave"
        elif r.check_out:
            state = "checked_out"
        else:
            state = "checked_in"
        result.append(
            {
                "nurse_id": n.id,
                "nurse_name": n.full_name,
                "state": state,
                "check_in": r.check_in.isoformat() if r and r.check_in else None,
                "check_out": r.check_out.isoformat() if r and r.check_out else None,
            }
        )
    return result