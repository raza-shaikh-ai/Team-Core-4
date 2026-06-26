from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
import psycopg2.extras
import math
import os
import smtplib
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.produce import ProduceCreate, ProduceUpdate, ProduceOut

router = APIRouter(prefix="/produce", tags=["Produce"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _haversine_km(lat1, lon1, lat2, lon2) -> float:
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _send_ngo_notification(ngo_email: str, ngo_name: str, produce: dict, distance_km: float, farmer_name: str):
    """Send a produce availability notification email to a single NGO."""
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if not smtp_user or not smtp_password:
        return

    urgency_days = (produce["harvest_date"] - __import__('datetime').date.today()).days
    if urgency_days <= 0:
        urgency_text = "⚠️ Harvest date has passed — urgent pickup needed!"
    elif urgency_days <= 2:
        urgency_text = f"⚠️ Only {urgency_days} day(s) left — donate soon!"
    else:
        urgency_text = f"✅ Fresh — harvested on {produce['harvest_date']}"

    msg = MIMEMultipart("alternative")
    msg["From"] = f"FarmShare Alerts <{smtp_user}>"
    msg["To"] = ngo_email
    msg["Subject"] = f"🌾 New Produce Near You: {produce['produce_name']} ({distance_km:.1f} km away)"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8">
    <style>
        body {{ font-family: 'Helvetica Neue', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0; }}
        .container {{ max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px;
                     border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }}
        .header {{ background: linear-gradient(135deg, #10b981, #059669); padding: 32px 40px; text-align: center; }}
        .header h1 {{ color: #fff; margin: 0; font-size: 22px; font-weight: 700; }}
        .header p {{ color: #a7f3d0; margin: 6px 0 0 0; font-size: 14px; }}
        .body {{ padding: 32px 40px; }}
        .greeting {{ font-size: 15px; color: #374151; margin-bottom: 20px; }}
        .produce-card {{ background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px;
                         padding: 20px; margin-bottom: 20px; }}
        .produce-name {{ font-size: 22px; font-weight: 800; color: #065f46; margin: 0 0 4px 0; }}
        .produce-farmer {{ font-size: 13px; color: #6b7280; margin: 0 0 16px 0; }}
        .detail-row {{ display: flex; justify-content: space-between; padding: 8px 0;
                       border-bottom: 1px solid #d1fae5; font-size: 14px; }}
        .detail-row:last-child {{ border-bottom: none; }}
        .detail-label {{ color: #6b7280; font-weight: 500; }}
        .detail-value {{ color: #111827; font-weight: 600; }}
        .distance-badge {{ background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 20px;
                           padding: 6px 14px; font-size: 13px; font-weight: 700;
                           color: #065f46; display: inline-block; margin: 16px 0 8px 0; }}
        .urgency {{ font-size: 13px; color: #92400e; background: #fffbeb; border: 1px solid #fcd34d;
                    border-radius: 8px; padding: 10px 14px; margin-bottom: 20px; }}
        .cta {{ text-align: center; margin: 24px 0; }}
        .btn {{ background: linear-gradient(135deg, #10b981, #059669); color: #fff; text-decoration: none;
                padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px;
                display: inline-block; }}
        .footer {{ background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 40px;
                   font-size: 12px; color: #9ca3af; text-align: center; }}
    </style>
    </head>
    <body>
    <div class="container">
        <div class="header">
            <h1>🌾 New Produce Available Near You</h1>
            <p>A farmer just listed produce within {distance_km:.1f} km of your location</p>
        </div>
        <div class="body">
            <p class="greeting">Hello <strong>{ngo_name}</strong>,</p>
            <p style="font-size:14px; color:#6b7280; margin-bottom:20px;">
                A farmer in your area has shared surplus produce on FarmShare.
                Be the first to request a pickup!
            </p>
            <div class="produce-card">
                <p class="produce-name">{produce['produce_name']}</p>
                <p class="produce-farmer">by {farmer_name} &middot; {produce.get('location', 'Unknown location')}</p>
                <div class="detail-row">
                    <span class="detail-label">Quantity Available</span>
                    <span class="detail-value">{produce['quantity']} kg</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Harvest Date</span>
                    <span class="detail-value">{produce['harvest_date']}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Pickup Location</span>
                    <span class="detail-value">{produce.get('location', 'Contact farmer')}</span>
                </div>
                <div class="distance-badge">📍 {distance_km:.1f} km from your location</div>
            </div>
            <div class="urgency">{urgency_text}</div>
            <div class="cta">
                <a href="http://13.234.42.87:8000/docs" class="btn">🚀 View &amp; Request Pickup</a>
            </div>
        </div>
        <div class="footer">
            &copy; 2026 FarmShare Inc. &mdash; Connecting surplus produce to food banks and NGOs.<br>
            You received this because your NGO is registered within 100 km of this produce.
        </div>
    </div>
    </body></html>
    """

    text = (f"New produce near you: {produce['produce_name']} by {farmer_name}.\n"
            f"Quantity: {produce['quantity']} kg | Harvest: {produce['harvest_date']}\n"
            f"Distance: {distance_km:.1f} km | Location: {produce.get('location', 'N/A')}\n"
            f"{urgency_text}")

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    try:
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"[NGO notify] Failed to send to {ngo_email}: {e}")


def notify_nearby_ngos(produce: dict, farmer_name: str):
    """
    Find all verified NGOs within 100 km of the produce location
    and send them an email notification. Runs in a background thread.
    """
    produce_lat = produce.get("latitude")
    produce_lng = produce.get("longitude")
    if produce_lat is None or produce_lng is None:
        return  # No coordinates — skip notification

    try:
        with get_db() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("""
                    SELECT id, name, email, latitude, longitude
                    FROM users
                    WHERE role = 'NGO'
                      AND is_verified = TRUE
                      AND latitude IS NOT NULL
                      AND longitude IS NOT NULL
                """)
                ngos = cur.fetchall()

        for ngo in ngos:
            dist = _haversine_km(produce_lat, produce_lng, ngo["latitude"], ngo["longitude"])
            if dist <= 100:
                _send_ngo_notification(
                    ngo_email=ngo["email"],
                    ngo_name=ngo["name"],
                    produce=produce,
                    distance_km=dist,
                    farmer_name=farmer_name,
                )
    except Exception as e:
        print(f"[NGO notify] Error during notification: {e}")


def _row_to_produce(row: dict) -> ProduceOut:
    row = dict(row)
    row["id"] = str(row["id"])
    row["farmer_id"] = str(row["farmer_id"])
    return ProduceOut(**row)


@router.post("", response_model=ProduceOut, status_code=201)
def create_produce(
    payload: ProduceCreate,
    current_user: dict = Depends(require_role("Farmer")),
):
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO produce (farmer_id, produce_name, quantity, harvest_date, location, image_url, latitude, longitude)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    current_user["id"],
                    payload.produce_name,
                    payload.quantity,
                    payload.harvest_date,
                    payload.location,
                    payload.image_url,
                    payload.latitude,
                    payload.longitude,
                ),
            )
            row = dict(cur.fetchone())

    row["farmer_name"] = current_user["name"]
    result = _row_to_produce(row)

    # Fire-and-forget: notify nearby NGOs in background (non-blocking)
    produce_dict = {
        "produce_name": row["produce_name"],
        "quantity":     float(row["quantity"]),
        "harvest_date": row["harvest_date"],
        "location":     row["location"],
        "latitude":     row.get("latitude"),
        "longitude":    row.get("longitude"),
    }
    t = threading.Thread(
        target=notify_nearby_ngos,
        args=(produce_dict, current_user["name"]),
        daemon=True,
    )
    t.start()

    return result


@router.get("", response_model=List[ProduceOut])
def list_produce(
    location: Optional[str] = Query(None),
    produce_name: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    filters = ["1=1"]
    values = []

    if location:
        filters.append("LOWER(p.location) LIKE %s")
        values.append(f"%{location.lower()}%")
    if produce_name:
        filters.append("LOWER(p.produce_name) LIKE %s")
        values.append(f"%{produce_name.lower()}%")
    if status:
        filters.append("p.status = %s")
        values.append(status)

    where_clause = " AND ".join(filters)

    query = f"""
        SELECT p.*, u.name AS farmer_name
        FROM produce p
        JOIN users u ON u.id = p.farmer_id
        WHERE {where_clause}
        ORDER BY p.created_at DESC
    """

    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query, values)
            rows = cur.fetchall()

    return [_row_to_produce(r) for r in rows]


@router.get("/my", response_model=List[ProduceOut])
def my_produce(current_user: dict = Depends(require_role("Farmer"))):
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT p.*, u.name AS farmer_name
                FROM produce p
                JOIN users u ON u.id = p.farmer_id
                WHERE p.farmer_id = %s
                ORDER BY p.created_at DESC
                """,
                (current_user["id"],),
            )
            rows = cur.fetchall()

    return [_row_to_produce(r) for r in rows]


@router.get("/{produce_id}", response_model=ProduceOut)
def get_produce(produce_id: str, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT p.*, u.name AS farmer_name
                FROM produce p
                JOIN users u ON u.id = p.farmer_id
                WHERE p.id = %s
                """,
                (produce_id,),
            )
            row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Produce not found")
    return _row_to_produce(row)


@router.put("/{produce_id}", response_model=ProduceOut)
def update_produce(
    produce_id: str,
    payload: ProduceUpdate,
    current_user: dict = Depends(require_role("Farmer")),
):
    update_fields = payload.model_dump(exclude_none=True)
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join([f"{k} = %s" for k in update_fields.keys()])
    values = list(update_fields.values()) + [produce_id, current_user["id"]]

    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"""
                UPDATE produce SET {set_clause}
                WHERE id = %s AND farmer_id = %s
                RETURNING *
                """,
                values,
            )
            row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Produce not found or not yours")

    row = dict(row)
    row["farmer_name"] = current_user["name"]
    return _row_to_produce(row)


@router.delete("/{produce_id}", status_code=204)
def delete_produce(
    produce_id: str,
    current_user: dict = Depends(require_role("Farmer")),
):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM produce WHERE id = %s AND farmer_id = %s RETURNING id",
                (produce_id, current_user["id"]),
            )
            deleted = cur.fetchone()

    if not deleted:
        raise HTTPException(status_code=404, detail="Produce not found or not yours")
