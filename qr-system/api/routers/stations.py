"""
Stations Router

Endpoints:
  GET  /stations               — List all stations
  POST /stations               — Create a new station
  GET  /stations/{station_id}  — Get station by ID
  GET  /stations/by-url/{slug} — Get station by display URL slug
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Station
from schemas import StationCreate, StationResponse

router = APIRouter(prefix="/stations", tags=["Stations"])


def _make_display_url(name: str, station_id: uuid.UUID) -> str:
    """Generates a stable, human-readable display URL slug for a station."""
    slug = name.lower().replace(" ", "-").replace("_", "-")
    slug = "".join(c for c in slug if c.isalnum() or c == "-")
    return f"station/{slug}-{str(station_id)[:8]}"


@router.get("", response_model=list[StationResponse])
async def list_stations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Station).order_by(Station.name))
    return result.scalars().all()


@router.post("", response_model=StationResponse, status_code=status.HTTP_201_CREATED)
async def create_station(body: StationCreate, db: AsyncSession = Depends(get_db)):
    station = Station(**body.model_dump())
    db.add(station)
    await db.flush()
    station.display_url = _make_display_url(station.name, station.id)
    return station


@router.get("/{station_id}", response_model=StationResponse)
async def get_station(station_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    station = await db.get(Station, station_id)
    if station is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Station not found")
    return station


@router.get("/by-url/{slug}", response_model=StationResponse)
async def get_station_by_url(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Station).where(Station.display_url.like(f"%{slug}%"))
    )
    station = result.scalar_one_or_none()
    if station is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Station not found")
    return station
