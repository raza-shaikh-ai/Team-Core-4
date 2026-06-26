from fastapi import APIRouter, Depends
import psycopg2.extras

from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/map", tags=["Map"])


@router.get("/data")
def get_map_data(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Farmers with their active produce listings
            cur.execute("""
                SELECT
                    u.id AS user_id,
                    u.name AS farmer_name,
                    u.latitude AS user_lat,
                    u.longitude AS user_lng,
                    p.id AS produce_id,
                    p.produce_name,
                    p.quantity,
                    p.status,
                    p.location,
                    p.latitude AS produce_lat,
                    p.longitude AS produce_lng
                FROM produce p
                JOIN users u ON u.id = p.farmer_id
                WHERE p.status != 'delivered'
                ORDER BY p.created_at DESC
            """)
            produce_rows = cur.fetchall()

            # NGO users with coordinates
            cur.execute("""
                SELECT id, name, latitude, longitude
                FROM users
                WHERE role = 'NGO' AND is_verified = TRUE
                  AND latitude IS NOT NULL AND longitude IS NOT NULL
            """)
            ngo_rows = cur.fetchall()

    farmers = []
    seen_coords = set()

    for row in produce_rows:
        lat = row["produce_lat"] or row["user_lat"]
        lng = row["produce_lng"] or row["user_lng"]
        if lat is None or lng is None:
            continue
        farmers.append({
            "type": "farmer",
            "id": str(row["produce_id"]),
            "name": row["farmer_name"],
            "produce_name": row["produce_name"],
            "quantity": row["quantity"],
            "status": row["status"],
            "location": row["location"],
            "lat": lat,
            "lng": lng,
        })

    ngos = []
    for row in ngo_rows:
        ngos.append({
            "type": "ngo",
            "id": str(row["id"]),
            "name": row["name"],
            "lat": row["latitude"],
            "lng": row["longitude"],
        })

    return {"farmers": farmers, "ngos": ngos}
