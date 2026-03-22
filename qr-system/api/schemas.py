import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


# ── Station ───────────────────────────────────────────────────────────────────

class StationBase(BaseModel):
    name: str
    type: Literal["entry", "work_station"]
    warehouse: str | None = None


class StationCreate(StationBase):
    pass


class StationResponse(StationBase):
    id: uuid.UUID
    display_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── QR Token ──────────────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    """Active token info returned to the station display screen."""
    token: uuid.UUID
    station_id: uuid.UUID
    expires_at: datetime
    qr_value: str  # Full value embedded in the QR code

    model_config = {"from_attributes": True}


class TokenValidateRequest(BaseModel):
    """Token validation request sent when a user scans a QR code."""
    token: uuid.UUID
    station_id: uuid.UUID
    personnel_id: uuid.UUID  # User ID from JWT


class TokenValidateResponse(BaseModel):
    """Token validation result."""
    valid: bool
    station_id: uuid.UUID | None = None
    station_name: str | None = None
    station_type: str | None = None  # 'entry' | 'work_station'
    used_at: datetime | None = None
    next_token: uuid.UUID | None = None  # New token issued after successful validation
    message: str


class TokenStatusItem(BaseModel):
    """Single row in the Admin Portal token list."""
    id: uuid.UUID
    station_id: uuid.UUID
    station_name: str
    token: uuid.UUID
    used: bool
    created_at: datetime
    used_at: datetime | None
    expires_at: datetime
    status: Literal["active", "used", "expired"]

    model_config = {"from_attributes": True}


class TokenListResponse(BaseModel):
    items: list[TokenStatusItem]
    total: int
    active_count: int
    used_count: int
    expired_count: int
