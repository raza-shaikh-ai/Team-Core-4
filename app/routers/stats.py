from fastapi import APIRouter, Depends
import psycopg2.extras

from app.database import get_db
from app.dependencies import get_current_user, require_role

router = APIRouter(prefix="/stats", tags=["Stats"])


@router.get("/farmer")
def farmer_stats(current_user: dict = Depends(require_role("Farmer"))):
    uid = current_user["id"]
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT COUNT(*) AS total FROM produce WHERE farmer_id = %s", (uid,))
            total_uploaded = cur.fetchone()["total"]

            cur.execute(
                "SELECT COUNT(*) AS cnt FROM produce WHERE farmer_id = %s AND status NOT IN ('delivered')",
                (uid,)
            )
            active_listings = cur.fetchone()["cnt"]

            cur.execute(
                """
                SELECT COUNT(*) AS cnt FROM pickup_requests pr
                JOIN produce p ON p.id = pr.produce_id
                WHERE p.farmer_id = %s AND pr.status = 'pending'
                """,
                (uid,)
            )
            pending_requests = cur.fetchone()["cnt"]

            cur.execute(
                """
                SELECT COUNT(*) AS cnt FROM pickup_requests pr
                JOIN produce p ON p.id = pr.produce_id
                WHERE p.farmer_id = %s AND pr.status = 'delivered'
                """,
                (uid,)
            )
            completed_donations = cur.fetchone()["cnt"]

            cur.execute(
                """
                SELECT COALESCE(SUM(p.quantity), 0) AS total_kg
                FROM produce p WHERE p.farmer_id = %s AND p.status = 'delivered'
                """,
                (uid,)
            )
            total_kg_donated = float(cur.fetchone()["total_kg"])

    return {
        "total_uploaded": total_uploaded,
        "active_listings": active_listings,
        "pending_requests": pending_requests,
        "completed_donations": completed_donations,
        "total_kg_donated": total_kg_donated,
    }


@router.get("/ngo")
def ngo_stats(current_user: dict = Depends(require_role("NGO"))):
    uid = current_user["id"]
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT COUNT(*) AS total FROM pickup_requests WHERE ngo_id = %s", (uid,))
            total_requests = cur.fetchone()["total"]

            cur.execute(
                "SELECT COUNT(*) AS cnt FROM pickup_requests WHERE ngo_id = %s AND status = 'accepted'",
                (uid,)
            )
            accepted_requests = cur.fetchone()["cnt"]

            cur.execute(
                "SELECT COUNT(*) AS cnt FROM pickup_requests WHERE ngo_id = %s AND status = 'delivered'",
                (uid,)
            )
            completed_deliveries = cur.fetchone()["cnt"]

            cur.execute(
                """
                SELECT COALESCE(SUM(p.quantity), 0) AS total_kg
                FROM pickup_requests pr
                JOIN produce p ON p.id = pr.produce_id
                WHERE pr.ngo_id = %s AND pr.status = 'delivered'
                """,
                (uid,)
            )
            total_kg_received = float(cur.fetchone()["total_kg"])

    return {
        "total_requests": total_requests,
        "accepted_requests": accepted_requests,
        "completed_deliveries": completed_deliveries,
        "total_kg_received": total_kg_received,
    }


@router.get("/platform")
def platform_stats(current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT COUNT(*) AS cnt FROM users WHERE role = 'Farmer' AND is_verified = TRUE")
            total_farmers = cur.fetchone()["cnt"]

            cur.execute("SELECT COUNT(*) AS cnt FROM users WHERE role = 'NGO' AND is_verified = TRUE")
            total_ngos = cur.fetchone()["cnt"]

            cur.execute("SELECT COUNT(*) AS cnt FROM produce")
            total_produce = cur.fetchone()["cnt"]

            cur.execute("SELECT COUNT(*) AS cnt FROM pickup_requests WHERE status = 'delivered'")
            total_donations = cur.fetchone()["cnt"]

    return {
        "total_farmers": total_farmers,
        "total_ngos": total_ngos,
        "total_produce": total_produce,
        "total_donations": total_donations,
    }
