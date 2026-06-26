from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class ProduceCreate(BaseModel):
    produce_name: str
    quantity: float
    harvest_date: date
    location: str
    image_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class ProduceUpdate(BaseModel):
    produce_name: Optional[str] = None
    quantity: Optional[float] = None
    harvest_date: Optional[date] = None
    location: Optional[str] = None
    image_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


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
    latitude: Optional[float] = None
    longitude: Optional[float] = None


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
