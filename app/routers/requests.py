from fastapi import APIRouter, HTTPException, Depends
from typing import List
import psycopg2.extras

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.produce import PickupRequestOut

router = APIRouter(prefix="/requests", tags=["Pickup Requests"])


def _row_to_request(row: dict) -> PickupRequestOut:
    row = dict(row)
    for key in ("id", "produce_id", "ngo_id", "farmer_id"):
        if key in row and row[key]:
            row[key] = str(row[key])
    return PickupRequestOut(**row)


@router.post("/{produce_id}", response_model=PickupRequestOut, status_code=201)
def request_pickup(
    produce_id: str,
    current_user: dict = Depends(require_role("NGO")),
):
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM produce WHERE id = %s", (produce_id,))
            produce = cur.fetchone()

            if not produce:
                raise HTTPException(status_code=404, detail="Produce not found")
            if produce["status"] != "available":
                raise HTTPException(
                    status_code=409,
                    detail=f"Produce is already '{produce['status']}' and cannot be requested"
                )

            cur.execute(
                """
                SELECT id FROM pickup_requests
                WHERE produce_id = %s AND ngo_id = %s AND status = 'pending'
                """,
                (produce_id, current_user["id"]),
            )
            if cur.fetchone():
                raise HTTPException(status_code=409, detail="You already have a pending request for this produce")

            cur.execute(
                """
                INSERT INTO pickup_requests (produce_id, ngo_id, farmer_id)
                VALUES (%s, %s, %s)
                RETURNING *
                """,
                (produce_id, current_user["id"], str(produce["farmer_id"])),
            )
            req = dict(cur.fetchone())

            cur.execute(
                "UPDATE produce SET status = 'requested' WHERE id = %s",
                (produce_id,),
            )

            cur.execute("SELECT name FROM users WHERE id = %s", (str(produce["farmer_id"]),))
            farmer = cur.fetchone()

    req["ngo_name"] = current_user["name"]
    req["farmer_name"] = farmer["name"] if farmer else None
    req["produce_name"] = produce["produce_name"]
    req["quantity"] = float(produce["quantity"])
    req["location"] = produce["location"]

    return _row_to_request(req)


@router.get("/incoming", response_model=List[PickupRequestOut])
def incoming_requests(current_user: dict = Depends(require_role("Farmer"))):
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT
                    r.*,
                    ngo.name  AS ngo_name,
                    f.name    AS farmer_name,
                    p.produce_name,
                    p.quantity,
                    p.location
                FROM pickup_requests r
                JOIN users ngo ON ngo.id = r.ngo_id
                JOIN users f   ON f.id   = r.farmer_id
                JOIN produce p ON p.id   = r.produce_id
                WHERE r.farmer_id = %s
                ORDER BY r.requested_at DESC
                """,
                (current_user["id"],),
            )
            rows = cur.fetchall()

    return [_row_to_request(r) for r in rows]


@router.get("/my", response_model=List[PickupRequestOut])
def my_requests(current_user: dict = Depends(require_role("NGO"))):
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT
                    r.*,
                    ngo.name  AS ngo_name,
                    f.name    AS farmer_name,
                    p.produce_name,
                    p.quantity,
                    p.location
                FROM pickup_requests r
                JOIN users ngo ON ngo.id = r.ngo_id
                JOIN users f   ON f.id   = r.farmer_id
                JOIN produce p ON p.id   = r.produce_id
                WHERE r.ngo_id = %s
                ORDER BY r.requested_at DESC
                """,
                (current_user["id"],),
            )
            rows = cur.fetchall()

    return [_row_to_request(r) for r in rows]


@router.put("/{request_id}/accept", response_model=PickupRequestOut)
def accept_request(
    request_id: str,
    current_user: dict = Depends(require_role("Farmer")),
):
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT * FROM pickup_requests WHERE id = %s AND farmer_id = %s",
                (request_id, current_user["id"]),
            )
            req = cur.fetchone()
            if not req:
                raise HTTPException(status_code=404, detail="Request not found or not yours")
            if req["status"] != "pending":
                raise HTTPException(status_code=409, detail=f"Request is already '{req['status']}'")

            cur.execute(
                """
                UPDATE pickup_requests
                SET status = 'accepted', updated_at = NOW()
                WHERE id = %s
                RETURNING *
                """,
                (request_id,),
            )
            updated = dict(cur.fetchone())

            cur.execute(
                "UPDATE produce SET status = 'pickup_scheduled' WHERE id = %s",
                (str(req["produce_id"]),),
            )

            cur.execute(
                """
                UPDATE pickup_requests
                SET status = 'rejected', updated_at = NOW()
                WHERE produce_id = %s AND id != %s AND status = 'pending'
                """,
                (str(req["produce_id"]), request_id),
            )

            cur.execute("SELECT name FROM users WHERE id = %s", (str(req["ngo_id"]),))
            ngo = cur.fetchone()
            cur.execute("SELECT produce_name, quantity, location FROM produce WHERE id = %s", (str(req["produce_id"]),))
            produce = cur.fetchone()

    updated["ngo_name"] = ngo["name"] if ngo else None
    updated["farmer_name"] = current_user["name"]
    if produce:
        updated["produce_name"] = produce["produce_name"]
        updated["quantity"] = float(produce["quantity"])
        updated["location"] = produce["location"]

    return _row_to_request(updated)


@router.put("/{request_id}/reject", response_model=PickupRequestOut)
def reject_request(
    request_id: str,
    current_user: dict = Depends(require_role("Farmer")),
):
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT * FROM pickup_requests WHERE id = %s AND farmer_id = %s",
                (request_id, current_user["id"]),
            )
            req = cur.fetchone()
            if not req:
                raise HTTPException(status_code=404, detail="Request not found or not yours")
            if req["status"] != "pending":
                raise HTTPException(status_code=409, detail=f"Request is already '{req['status']}'")

            cur.execute(
                """
                UPDATE pickup_requests
                SET status = 'rejected', updated_at = NOW()
                WHERE id = %s
                RETURNING *
                """,
                (request_id,),
            )
            updated = dict(cur.fetchone())

            cur.execute(
                """
                SELECT id FROM pickup_requests
                WHERE produce_id = %s AND status = 'accepted'
                """,
                (str(req["produce_id"]),),
            )
            if not cur.fetchone():
                cur.execute(
                    "UPDATE produce SET status = 'available' WHERE id = %s AND status = 'requested'",
                    (str(req["produce_id"]),),
                )

            cur.execute("SELECT name FROM users WHERE id = %s", (str(req["ngo_id"]),))
            ngo = cur.fetchone()
            cur.execute("SELECT produce_name, quantity, location FROM produce WHERE id = %s", (str(req["produce_id"]),))
            produce = cur.fetchone()

    updated["ngo_name"] = ngo["name"] if ngo else None
    updated["farmer_name"] = current_user["name"]
    if produce:
        updated["produce_name"] = produce["produce_name"]
        updated["quantity"] = float(produce["quantity"])
        updated["location"] = produce["location"]

    return _row_to_request(updated)


@router.put("/{request_id}/delivered", response_model=PickupRequestOut)
def mark_delivered(
    request_id: str,
    current_user: dict = Depends(require_role("NGO")),
):
    with get_db() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT * FROM pickup_requests WHERE id = %s AND ngo_id = %s",
                (request_id, current_user["id"]),
            )
            req = cur.fetchone()
            if not req:
                raise HTTPException(status_code=404, detail="Request not found or not yours")
            if req["status"] != "accepted":
                raise HTTPException(
                    status_code=409,
                    detail=f"Only accepted requests can be marked delivered (current: '{req['status']}')"
                )

            cur.execute(
                """
                UPDATE pickup_requests
                SET status = 'delivered', updated_at = NOW()
                WHERE id = %s
                RETURNING *
                """,
                (request_id,),
            )
            updated = dict(cur.fetchone())

            cur.execute(
                "UPDATE produce SET status = 'delivered' WHERE id = %s",
                (str(req["produce_id"]),),
            )

            cur.execute("SELECT name FROM users WHERE id = %s", (str(req["farmer_id"]),))
            farmer = cur.fetchone()
            cur.execute("SELECT produce_name, quantity, location FROM produce WHERE id = %s", (str(req["produce_id"]),))
            produce = cur.fetchone()

    updated["ngo_name"] = current_user["name"]
    updated["farmer_name"] = farmer["name"] if farmer else None
    if produce:
        updated["produce_name"] = produce["produce_name"]
        updated["quantity"] = float(produce["quantity"])
        updated["location"] = produce["location"]

    return _row_to_request(updated)
