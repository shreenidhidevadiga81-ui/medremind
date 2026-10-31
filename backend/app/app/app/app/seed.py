from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models
from .security import hash_password


def seed_admin(db: Session) -> None:
    exists = db.scalar(select(models.User).where(models.User.role == "admin"))
    if exists:
        return
    db.add(
        models.User(
            full_name="Head Admin",
            username="admin",
            phone="9000000000",
            password_hash=hash_password("Admin@12345"),
            role="admin",
            must_change_password=True,
        )
    )
    db.commit()