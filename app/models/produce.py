from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class ProduceCreate(BaseModel):
    produce_name: str
    quantity: float
    harvest_date: date
    location: str
    image_url: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "produce_name": "Tomato",
                "quantity": 150.0,
                "harvest_date": "2024-06-20",
                "location": "Nashik, Maharashtra",
                "image_url": None
            }
        }
    }


class ProduceUpdate(BaseModel):
    produce_name: Optional[str] = None
    quantity: Optional[float] = None
    harvest_date: Optional[date] = None
    location: Optional[str] = None
    image_url: Optional[str] = None


class ProduceOut(BaseModel):
    id: str
    farmer_id: str
    farmer_name: Optional[str] = None
    produce_name: str
    quantity: float
    harvest_date: date
    location: str
    image_url: Optional[str]
    status: str
    created_at: datetime


class PickupRequestOut(BaseModel):
    id: str
    produce_id: str
    ngo_id: str
    ngo_name: Optional[str] = None
    farmer_id: str
    farmer_name: Optional[str] = None
    status: str
    requested_at: datetime
    updated_at: datetime
    produce_name: Optional[str] = None
    quantity: Optional[float] = None
    location: Optional[str] = None
