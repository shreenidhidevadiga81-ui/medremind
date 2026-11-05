import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Auth"])

OTP_MINUTES = 10
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_SECONDS = 60


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def find_user(db: Session, identifier: str) -> models.User | None:
    return db.scalar(
        select(models.User).where(
            or_(models.User.username == identifier, models.User.phone == identifier)
        )
    )


def latest_otp(db: Session, user_id: int, only_unused: bool) -> models.PasswordResetOTP | None:
    stmt = select(models.PasswordResetOTP).where(models.PasswordResetOTP.user_id == user_id)
    if only_unused:
        stmt = stmt.where(models.PasswordResetOTP.used.is_(False))
    return db.scalar(stmt.order_by(models.PasswordResetOTP.id.desc()).limit(1))


@router.post("/login", response_model=schemas.TokenResponse)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = find_user(db, data.identifier.strip())
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Wrong username/phone or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account is disabled")
    token = create_access_token(user.id, user.role)
    return schemas.TokenResponse(
        access_token=token,
        role=user.role,
        must_change_password=user.must_change_password,
    )


@router.get("/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(get_current_user)):
    return user


@router.post("/change-password")
def change_password(
    data: schemas.ChangePasswordRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(data.old_password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Old password is wrong")
    user.password_hash = hash_password(data.new_password)
    user.must_change_password = False
    db.commit()
    return {"message": "Password changed"}


@router.post("/forgot-password")
def forgot_password(data: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    # Same answer whether or not the account exists, so nobody can probe for accounts.
    generic = {
        "message": "If this account exists, a code has been sent to its registered phone number."
    }
    user = find_user(db, data.identifier.strip())
    if user is None or not user.is_active:
        return generic

    recent = latest_otp(db, user.id, only_unused=False)
    if recent and (utcnow() - recent.created_at.replace(tzinfo=None)).total_seconds() < OTP_RESEND_SECONDS:
        return generic

    # Any older unused codes stop working.
    older = db.scalars(
        select(models.PasswordResetOTP).where(
            models.PasswordResetOTP.user_id == user.id,
            models.PasswordResetOTP.used.is_(False),
        )
    ).all()
    for old in older:
        old.used = True

    code = f"{secrets.randbelow(1_000_000):06d}"
    db.add(
        models.PasswordResetOTP(
            user_id=user.id,
            code_hash=hash_password(code),
            expires_at=utcnow() + timedelta(minutes=OTP_MINUTES),
        )
    )
    db.commit()

    # DEV ONLY: a real app would send this by SMS instead of printing it.
    print(f"\n[DEV ONLY] Password reset code for {user.username} ({user.phone}): {code}\n", flush=True)
    return generic


@router.post("/reset-password")
def reset_password(data: schemas.ResetWithOTPRequest, db: Session = Depends(get_db)):
    invalid = HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired code")

    user = find_user(db, data.identifier.strip())
    if user is None or not user.is_active:
        raise invalid

    otp = latest_otp(db, user.id, only_unused=True)
    if otp is None or otp.expires_at < utcnow() or otp.attempts >= OTP_MAX_ATTEMPTS:
        raise invalid

    if not verify_password(data.otp, otp.code_hash):
        otp.attempts += 1
        db.commit()
        raise invalid

    otp.used = True
    user.password_hash = hash_password(data.new_password)
    user.must_change_password = False
    db.commit()
    return {"message": "Password changed. You can now sign in."}