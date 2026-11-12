from pydantic import BaseModel, Field


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