import re
from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator

TIME_PATTERN = re.compile(r"^([01][0-9]|2[0-3]):[0-5][0-9]$")


class LoginRequest(BaseModel):
    identifier: str  # username or phone number
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    must_change_password: bool


class UserOut(BaseModel):
    id: int
    full_name: str
    username: str
    phone: str
    role: str
    is_active: bool
    must_change_password: bool

    model_config = {"from_attributes": True}


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(min_length=8)


class NurseCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    username: str = Field(min_length=3, max_length=50)
    phone: str = Field(pattern=r"^[0-9]{10}$")
    password: str = Field(min_length=8)


class NurseUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=100)
    phone: str | None = Field(default=None, pattern=r"^[0-9]{10}$")
    is_active: bool | None = None


class ResetPasswordRequest(BaseModel):
    new_password: str = Field(min_length=8)


class ForgotPasswordRequest(BaseModel):
    identifier: str  # username or phone number


class ResetWithOTPRequest(BaseModel):
    identifier: str
    otp: str = Field(pattern=r"^[0-9]{6}$")
    new_password: str = Field(min_length=8)


class ResidentCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    id_number: str | None = Field(default=None, max_length=50)
    age: int | None = Field(default=None, ge=0, le=130)
    gender: str | None = Field(default=None, max_length=10)
    room: str | None = Field(default=None, max_length=20)
    medical_conditions: str | None = None
    allergies: str | None = None
    contact_number: str | None = Field(default=None, pattern=r"^[0-9]{10}$")
    # optional: create a family login together with the resident
    family_full_name: str | None = Field(default=None, min_length=2, max_length=100)
    family_username: str | None = Field(default=None, min_length=3, max_length=50)
    family_phone: str | None = Field(default=None, pattern=r"^[0-9]{10}$")
    family_password: str | None = Field(default=None, min_length=8)


class ResidentOut(BaseModel):
    id: int
    resident_number: str
    full_name: str
    id_number: str | None
    age: int | None
    gender: str | None
    room: str | None
    medical_conditions: str | None
    allergies: str | None
    contact_number: str | None
    assigned_nurse_id: int | None
    family_user_id: int | None
    status: str

    model_config = {"from_attributes": True}


class MedicineCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    dosage: str = Field(min_length=1, max_length=50)  # e.g. "500 mg"
    times: list[str] = Field(min_length=1, max_length=6)  # e.g. ["08:00", "20:00"]
    instructions: str | None = None  # e.g. "after food"
    start_date: date | None = None  # empty means today
    end_date: date | None = None  # empty means no end

    @field_validator("times")
    @classmethod
    def check_times(cls, value):
        for t in value:
            if not TIME_PATTERN.match(t):
                raise ValueError("Times must look like 08:00 (24-hour format)")
        return sorted(set(value))


class MedicineOut(BaseModel):
    id: int
    resident_id: int
    name: str
    dosage: str
    times: list[str]
    instructions: str | None
    start_date: date
    end_date: date | None
    is_active: bool

    model_config = {"from_attributes": True}

    @field_validator("times", mode="before")
    @classmethod
    def split_times(cls, value):
        # the database stores times as "08:00,20:00"; the API shows a list
        if isinstance(value, str):
            return [t for t in value.split(",") if t]
        return value


class DoseOut(BaseModel):
    id: int
    medicine_id: int
    resident_id: int
    scheduled_for: datetime
    status: str
    given_by_id: int | None
    given_at: datetime | None
    note: str | None
    # filled in by the API so the screen can show names
    medicine_name: str | None = None
    dosage: str | None = None
    resident_name: str | None = None

    model_config = {"from_attributes": True}


class DoseUpdate(BaseModel):
    status: str = Field(pattern=r"^(given|missed)$")
    note: str | None = Field(default=None, max_length=300)

    

class VitalCreate(BaseModel):
    systolic: int | None = Field(default=None, ge=40, le=300)  # top BP number
    diastolic: int | None = Field(default=None, ge=20, le=200)  # bottom BP number
    sugar: int | None = Field(default=None, ge=20, le=800)  # mg/dL
    oxygen: int | None = Field(default=None, ge=50, le=100)  # SpO2 %


class VitalOut(BaseModel):
    id: int
    resident_id: int
    systolic: int | None
    diastolic: int | None
    sugar: int | None
    oxygen: int | None
    is_critical: bool
    critical_reason: str | None
    recorded_by_id: int | None
    recorded_at: datetime

    model_config = {"from_attributes": True}