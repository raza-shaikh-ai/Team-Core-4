from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from datetime import datetime


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Literal["Farmer", "NGO"]
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: datetime
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class VerifyOTP(BaseModel):
    email: EmailStr
    otp_code: str
