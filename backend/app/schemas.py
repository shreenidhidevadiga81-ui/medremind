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