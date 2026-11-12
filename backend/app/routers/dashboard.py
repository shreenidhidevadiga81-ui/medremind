from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..deps import require_roles

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
admin_only = require_roles("admin")


def score_color(score: float | None) -> str:
    if score is None:
        return "none"
    if score >= 8:
        return "green"
    if score >= 6:
        return "yellow"
    return "red"


@router.get("")
def dashboard(
    db: Session = Depends(get_db),
    _admin: models.User = Depends(admin_only),
):
    today = date.today()
    day_start = datetime.combine(today, time.min)
    day_end = day_start + timedelta(days=1)

    total_residents = db.scalar(
        select(func.count(models.Resident.id)).where(models.Resident.status == "active")
    )
    total_nurses = db.scalar(
        select(func.count(models.User.id)).where(
            models.User.role == "nurse", models.User.is_active.is_(True)
        )
    )

    # today's doses by status
    rows = db.execute(
        select(models.DoseLog.status, func.count(models.DoseLog.id))
        .where(models.DoseLog.scheduled_for >= day_start, models.DoseLog.scheduled_for < day_end)
        .group_by(models.DoseLog.status)
    ).all()
    counts = {status: n for status, n in rows}
    doses_today = {
        "total": sum(counts.values()),
        "given": counts.get("given", 0),
        "missed": counts.get("missed", 0),
        "pending": counts.get("pending", 0),
    }

    # critical readings from the last 24 hours
    since = datetime.utcnow() - timedelta(hours=24)
    critical_rows = db.execute(
        select(models.Vital, models.Resident)
        .join(models.Resident, models.Resident.id == models.Vital.resident_id)
        .where(models.Vital.is_critical.is_(True), models.Vital.recorded_at >= since)
        .order_by(models.Vital.recorded_at.desc())
    ).all()
    critical_alerts = [
        {
            "id": v.id,
            "resident_name": r.full_name,
            "resident_number": r.resident_number,
            "room": r.room,
            "reason": v.critical_reason,
            "recorded_at": v.recorded_at.isoformat(),
        }
        for v, r in critical_rows
    ]

    # nurse performance for today: 10 x (given / scheduled)
    nurses = db.scalars(
        select(models.User)
        .where(models.User.role == "nurse", models.User.is_active.is_(True))
        .order_by(models.User.full_name)
    ).all()
    nurse_scores = []
    for nurse in nurses:
        # doses that belong to this nurse's residents
        dose_rows = db.execute(
            select(models.DoseLog.status, func.count(models.DoseLog.id))
            .join(models.Resident, models.Resident.id == models.DoseLog.resident_id)
            .where(
                models.Resident.assigned_nurse_id == nurse.id,
                models.DoseLog.scheduled_for >= day_start,
                models.DoseLog.scheduled_for < day_end,
            )
            .group_by(models.DoseLog.status)
        ).all()
        c = {status: n for status, n in dose_rows}
        scheduled = sum(c.values())
        given = c.get("given", 0)
        score = round(10 * given / scheduled, 1) if scheduled else None
        nurse_scores.append(
            {
                "nurse_id": nurse.id,
                "name": nurse.full_name,
                "scheduled": scheduled,
                "given": given,
                "missed": c.get("missed", 0),
                "pending": c.get("pending", 0),
                "score": score,
                "color": score_color(score),
            }
        )

    return {
        "total_residents": total_residents,
        "total_nurses": total_nurses,
        "doses_today": doses_today,
        "critical_alerts": critical_alerts,
        "nurse_scores": nurse_scores,
    }