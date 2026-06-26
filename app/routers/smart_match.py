import math
from datetime import date, datetime
from fastapi import APIRouter, Depends, Query
from typing import Optional, List
import psycopg2.extras

from app.database import get_db
from app.dependencies import require_role

router = APIRouter(prefix="/match", tags=["Smart Matching"])

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
DISTANCE_WEIGHT   = 0.40
FRESHNESS_WEIGHT  = 0.35
QUANTITY_WEIGHT   = 0.15
AVAIL_WEIGHT      = 0.10

MAX_KM   = 100     # distance at which distance score hits 0
MAX_DAYS = 7      # days old at which freshness score hits 0
MAX_KG   = 500    # quantity at which quantity score maxes out


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return the great-circle distance in km between two lat/lon points."""
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def compute_freshness_days(harvest_date) -> int:
    """Return how many days ago the produce was harvested (0 = today)."""
    today = date.today()
    if isinstance(harvest_date, datetime):
        harvest_date = harvest_date.date()
    delta = today - harvest_date
    return max(0, delta.days)


def get_urgency(days_old: int) -> dict:
    """Return urgency level label and CSS class for food waste prediction."""
    if days_old >= 6:
        return {"level": "critical", "label": "⚠️ Donate within 24 hrs"}
    elif days_old >= 4:
        return {"level": "high",     "label": "⚠️ Donate within 48 hrs"}
    elif days_old >= 2:
        return {"level": "medium",   "label": "🕐 Donate within 5 days"}
    else:
        return {"level": "fresh",    "label": "✅ Fresh"}


def compute_match_score(
    distance_km: Optional[float],
    days_old: int,
    quantity: float,
    status: str,
    has_ngo_location: bool,
) -> int:
    """
    Returns an integer 0–100 match score.
    Weights: Distance 40% | Freshness 35% | Quantity 15% | Availability 10%
    """
    score = 0.0

    # Distance (40%)
    if distance_km is not None:
        dist_score = max(0.0, 1.0 - distance_km / MAX_KM)
        score += dist_score * 40
    elif not has_ngo_location:
        score += 20  # partial credit when no location available at all

    # Freshness (35%)
    freshness_score = max(0.0, 1.0 - days_old / MAX_DAYS)
    score += freshness_score * 35

    # Quantity (15%)
    qty_score = min(1.0, quantity / MAX_KG)
    score += qty_score * 15

    # Availability (10%)
    if status == "available":
        score += 10
    elif status == "requested":
        score += 5

    return round(score)


def build_match_reasons(
    distance_km: Optional[float],
    days_old: int,
    quantity: float,
) -> List[str]:
    """Build 3 human-readable bullet-point reasons for the best match card."""
    reasons = []

    # Distance reason
    if distance_km is not None:
        if distance_km < 5:
            reasons.append(f"Just {distance_km:.1f} km away — very close")
        elif distance_km < 20:
            reasons.append(f"{distance_km:.1f} km away — can collect today")
        else:
            reasons.append(f"{distance_km:.1f} km away")
    else:
        reasons.append("Nearest available listing")

    # Freshness reason
    if days_old == 0:
        reasons.append("Harvested today — maximum freshness")
    elif days_old == 1:
        reasons.append("Harvested yesterday — very fresh")
    elif days_old <= 3:
        reasons.append(f"Harvested {days_old} days ago — still fresh")
    else:
        reasons.append(f"Needs urgent pickup — harvested {days_old} days ago")

    # Quantity reason
    if quantity >= 200:
        reasons.append(f"Large donation: {quantity} kg — high impact")
    elif quantity >= 50:
        reasons.append(f"Good quantity: {quantity} kg available")
    else:
        reasons.append(f"{quantity} kg available")

    return reasons


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.get("/smart")
def smart_match(
    lat: Optional[float] = Query(None, description="NGO current latitude"),
    lng: Optional[float] = Query(None, description="NGO current longitude"),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_role("NGO")),
):
    """
    Returns all non-delivered produce sorted by AI match score.
    Each item includes:
      - match_score  (0–100 int)
      - match_reasons (list of str, only on the best match)
      - urgency_level / urgency_label  (food waste prediction)
      - distance_km  (Haversine distance if NGO location provided)
    The first item in the response is always the best match.
    """
    # Prefer query-param coords, fall back to the user's stored coords
    ngo_lat = lat or current_user.get("latitude")
    ngo_lng = lng or current_user.get("longitude")
    has_location = ngo_lat is not None and ngo_lng is not None

    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("""
                SELECT
                    p.*,
                    u.name AS farmer_name,
                    u.latitude  AS farmer_user_lat,
                    u.longitude AS farmer_user_lng
                FROM produce p
                JOIN users u ON u.id = p.farmer_id
                WHERE p.status != 'delivered'
                ORDER BY p.created_at DESC
            """)
            rows = cur.fetchall()

    results = []
    for row in rows:
        row = dict(row)
        row["id"]        = str(row["id"])
        row["farmer_id"] = str(row["farmer_id"])

        # Resolve the best available lat/lng for this produce
        produce_lat = row.get("latitude") or row.get("farmer_user_lat")
        produce_lng = row.get("longitude") or row.get("farmer_user_lng")

        # Distance
        distance_km: Optional[float] = None
        if has_location and produce_lat is not None and produce_lng is not None:
            distance_km = round(
                haversine_km(ngo_lat, ngo_lng, produce_lat, produce_lng), 2
            )

        # Freshness
        days_old = compute_freshness_days(row["harvest_date"])
        urgency  = get_urgency(days_old)

        # Score
        score = compute_match_score(
            distance_km,
            days_old,
            float(row["quantity"]),
            row["status"],
            has_location,
        )

        results.append({
            "id":           row["id"],
            "farmer_id":    row["farmer_id"],
            "farmer_name":  row.get("farmer_name"),
            "produce_name": row["produce_name"],
            "quantity":     float(row["quantity"]),
            "harvest_date": str(row["harvest_date"]),
            "location":     row["location"],
            "image_url":    row.get("image_url"),
            "status":       row["status"],
            "created_at":   row["created_at"].isoformat(),
            "latitude":     produce_lat,
            "longitude":    produce_lng,
            # -- AI enrichment --
            "match_score":    score,
            "distance_km":    distance_km,
            "days_old":       days_old,
            "urgency_level":  urgency["level"],
            "urgency_label":  urgency["label"],
        })

    # Sort: available items first (by score), then other statuses (by score)
    results.sort(key=lambda x: (x["status"] != "available", -x["match_score"]))

    # Attach match_reasons only to the top item
    if results:
        top = results[0]
        top["match_reasons"] = build_match_reasons(
            top["distance_km"], top["days_old"], top["quantity"]
        )

    return {
        "ngo_location_used": has_location,
        "total": len(results),
        "items": results[:limit],
    }


@router.get("/urgency")
def get_urgency_list(
    current_user: dict = Depends(require_role("NGO")),
):
    """
    Returns all non-delivered produce with only urgency data.
    Useful for a quick food-waste dashboard widget.
    """
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("""
                SELECT p.id, p.produce_name, p.quantity, p.harvest_date,
                       p.location, p.status, u.name AS farmer_name
                FROM produce p
                JOIN users u ON u.id = p.farmer_id
                WHERE p.status != 'delivered'
                ORDER BY p.harvest_date ASC
            """)
            rows = cur.fetchall()

    result = []
    for row in rows:
        row = dict(row)
        days_old = compute_freshness_days(row["harvest_date"])
        urgency  = get_urgency(days_old)
        result.append({
            "id":           str(row["id"]),
            "produce_name": row["produce_name"],
            "farmer_name":  row["farmer_name"],
            "quantity":     float(row["quantity"]),
            "harvest_date": str(row["harvest_date"]),
            "location":     row["location"],
            "status":       row["status"],
            "days_old":     days_old,
            "urgency_level": urgency["level"],
            "urgency_label": urgency["label"],
        })

    # Group counts by urgency level
    counts = {"critical": 0, "high": 0, "medium": 0, "fresh": 0}
    for item in result:
        counts[item["urgency_level"]] += 1

    return {
        "summary": counts,
        "items": result,
    }
