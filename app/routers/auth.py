import os
import random
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import APIRouter, HTTPException, status, Depends
from passlib.context import CryptContext
import psycopg2.extras

from app.database import get_db
from app.dependencies import create_access_token, get_current_user
from app.models.user import UserRegister, UserLogin, TokenResponse, UserOut, VerifyOTP

router = APIRouter(prefix="/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def generate_otp() -> str:
    return f"{random.randint(100000, 999999)}"


def send_otp_email(to_email: str, otp_code: str):
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")

    msg = MIMEMultipart("alternative")
    msg["From"] = f"FarmShare <{smtp_user}>"
    msg["To"] = to_email
    msg["Subject"] = "Verify your FarmShare account"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                background-color: #f8fafc;
                margin: 0;
                padding: 0;
                -webkit-font-smoothing: antialiased;
            }}
            .container {{
                max-width: 540px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 12px;
                border: 1px solid #e2e8f0;
                padding: 40px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            }}
            .logo {{
                font-size: 28px;
                font-weight: 700;
                color: #10b981;
                text-align: center;
                margin-bottom: 24px;
            }}
            .header {{
                font-size: 20px;
                font-weight: 600;
                color: #0f172a;
                text-align: center;
                margin-bottom: 8px;
            }}
            .subtitle {{
                font-size: 14px;
                color: #64748b;
                text-align: center;
                margin-bottom: 32px;
                line-height: 1.5;
            }}
            .otp-box {{
                background-color: #f1f5f9;
                border-radius: 8px;
                padding: 16px;
                font-size: 32px;
                font-weight: 700;
                letter-spacing: 6px;
                color: #10b981;
                text-align: center;
                margin: 24px auto;
                max-width: 240px;
                border: 1px dashed #cbd5e1;
            }}
            .footer {{
                font-size: 12px;
                color: #94a3b8;
                text-align: center;
                margin-top: 32px;
                border-top: 1px solid #e2e8f0;
                padding-top: 24px;
                line-height: 1.5;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">🌾 FarmShare</div>
            <div class="header">Confirm your email address</div>
            <div class="subtitle">Please use the verification code below to complete your registration and activate your account.</div>
            <div class="otp-box">{otp_code}</div>
            <div class="subtitle" style="margin-bottom: 0; font-size: 13px;">This code is valid for 10 minutes. If you did not request this code, please ignore this email.</div>
            <div class="footer">
                &copy; 2026 FarmShare Inc. All rights reserved.<br>
                Connecting surplus produce directly to food banks and NGOs.
            </div>
        </div>
    </body>
    </html>
    """

    text_content = f"Your FarmShare verification code is: {otp_code}. It will expire in 10 minutes."

    msg.attach(MIMEText(text_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    try:
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send verification email: {str(e)}"
        )


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister):
    hashed = pwd_context.hash(payload.password)
    otp = generate_otp()

    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT id, is_verified FROM users WHERE email = %s", (payload.email,))
            existing = cur.fetchone()

            if existing:
                if existing["is_verified"]:
                    raise HTTPException(status_code=409, detail="Email already registered")
                else:
                    cur.execute(
                        """
                        UPDATE users
                        SET name = %s, password_hash = %s, role = %s, otp_code = %s,
                            otp_expires_at = NOW() + INTERVAL '10 minutes',
                            latitude = %s, longitude = %s
                        WHERE email = %s
                        """,
                        (payload.name, hashed, payload.role, otp,
                         payload.latitude, payload.longitude, payload.email),
                    )
            else:
                cur.execute(
                    """
                    INSERT INTO users (name, email, password_hash, role, is_verified, otp_code,
                                       otp_expires_at, latitude, longitude)
                    VALUES (%s, %s, %s, %s, FALSE, %s, NOW() + INTERVAL '10 minutes', %s, %s)
                    """,
                    (payload.name, payload.email, hashed, payload.role, otp,
                     payload.latitude, payload.longitude),
                )

    send_otp_email(payload.email, otp)
    return {"message": "Verification OTP sent to your email. Please verify to activate account."}


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(payload: VerifyOTP):
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT * FROM users
                WHERE email = %s AND otp_code = %s AND otp_expires_at > NOW()
                """,
                (payload.email, payload.otp_code),
            )
            user = cur.fetchone()

            if not user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or expired OTP code"
                )

            user = dict(user)
            cur.execute(
                """
                UPDATE users
                SET is_verified = TRUE, otp_code = NULL, otp_expires_at = NULL
                WHERE id = %s
                """,
                (user["id"],),
            )

    user["id"] = str(user["id"])
    token = create_access_token({"sub": user["id"], "role": user["role"]})

    return TokenResponse(
        access_token=token,
        user=UserOut(**user)
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin):
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM users WHERE email = %s", (payload.email,))
            user = cur.fetchone()

    if not user or not pwd_context.verify(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    user = dict(user)
    if not user.get("is_verified"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account not verified. Please verify your OTP."
        )

    user["id"] = str(user["id"])
    token = create_access_token({"sub": user["id"], "role": user["role"]})

    return TokenResponse(
        access_token=token,
        user=UserOut(**user)
    )



from pydantic import BaseModel

class UpdateLocation(BaseModel):
    latitude: float
    longitude: float


@router.patch("/location", status_code=200)
def update_location(
    payload: UpdateLocation,
    current_user: dict = Depends(get_current_user),
):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE users SET latitude = %s, longitude = %s WHERE id = %s",
                (payload.latitude, payload.longitude, current_user["id"]),
            )
    return {"message": "Location updated successfully"}
