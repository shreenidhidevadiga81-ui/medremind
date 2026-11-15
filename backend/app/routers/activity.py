from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..deps import require_roles

router = APIRouter(prefix="/activity", tags=["activity"])


@router.get("")
def list_activity(
    limit: int = 100,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_roles("admin")),
):
    limit = max(1, min(limit, 300))
    rows = db.execute(
        select(models.ActivityLog, models.User.full_name, models.User.role)
        .outerjoin(models.User, models.User.id == models.ActivityLog.user_id)
        .order_by(models.ActivityLog.created_at.desc())
        .limit(limit)
    ).all()
    return [
        {
            "id": log.id,
            "action": log.action,
            "details": log.details,
            "created_at": log.created_at.isoformat(),
            "user_name": name,
            "user_role": role,
        }
        for log, name, role in rows
    ]