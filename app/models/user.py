from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from datetime import datetime


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Literal["Farmer", "NGO"]

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Raju Farmer",
                "email": "raju@farm.com",
                "password": "secret123",
                "role": "Farmer"
            }
        }
    }


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "raju@farm.com",
                "password": "secret123"
            }
        }
    }


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class VerifyOTP(BaseModel):
    email: EmailStr
    otp_code: str
