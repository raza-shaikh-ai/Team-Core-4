from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
import psycopg2.extras

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.produce import ProduceCreate, ProduceUpdate, ProduceOut

router = APIRouter(prefix="/produce", tags=["Produce"])


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
    return _row_to_produce(row)


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
