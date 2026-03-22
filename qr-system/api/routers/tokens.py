"""
QR Token Router

Endpoints:
  GET  /tokens/station/{station_id}/current  — Get active token (for display screen)
  POST /tokens/station/{station_id}/generate — Generate new token
  POST /tokens/validate                      — Validate + consume token, issue new one
  GET  /tokens/admin/list                    — Admin: list all token statuses
  POST /tokens/admin/cleanup                 — Admin: remove expired tokens
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import QRToken, Station
from schemas import (
    TokenListResponse,
    TokenResponse,
    TokenStatusItem,
    TokenValidateRequest,
    TokenValidateResponse,
)

router = APIRouter(prefix="/tokens", tags=["QR Tokens"])


def _build_qr_value(station_id: uuid.UUID, token: uuid.UUID) -> str:
    """Builds the value embedded in the QR code. The User App parses this format."""
    return f"shifttrack://qr/{station_id}/{token}"


def _token_status(token: QRToken) -> str:
    now = datetime.now(timezone.utc)
    if token.used:
        return "used"
    if now >= token.expires_at:
        return "expired"
    return "active"


async def _get_or_create_active_token(station_id: uuid.UUID, db: AsyncSession) -> QRToken:
    """Returns the station's active token, creating one if none exists."""
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(QRToken)
        .where(
            QRToken.station_id == station_id,
            QRToken.used.is_(False),
            QRToken.expires_at > now,
        )
        .order_by(QRToken.created_at.desc())
        .limit(1)
    )
    token = result.scalar_one_or_none()
    if token is None:
        token = QRToken(station_id=station_id)
        db.add(token)
        await db.flush()
    return token


# ── Display screen: get current active token ──────────────────────────────────

@router.get(
    "/station/{station_id}/current",
    response_model=TokenResponse,
    summary="Get the active QR token for a station",
)
async def get_current_token(station_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    station = await db.get(Station, station_id)
    if station is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Station not found")

    token = await _get_or_create_active_token(station_id, db)
    return TokenResponse(
        token=token.token,
        station_id=token.station_id,
        expires_at=token.expires_at,
        qr_value=_build_qr_value(station_id, token.token),
    )


# ── Display screen: generate new token ────────────────────────────────────────

@router.post(
    "/station/{station_id}/generate",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a new token for a station (invalidates the current one)",
)
async def generate_token(station_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    station = await db.get(Station, station_id)
    if station is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Station not found")

    # Immediately expire all current active tokens for this station
    now = datetime.now(timezone.utc)
    await db.execute(
        update(QRToken)
        .where(
            QRToken.station_id == station_id,
            QRToken.used.is_(False),
            QRToken.expires_at > now,
        )
        .values(expires_at=now)
    )

    new_token = QRToken(station_id=station_id)
    db.add(new_token)
    await db.flush()

    return TokenResponse(
        token=new_token.token,
        station_id=new_token.station_id,
        expires_at=new_token.expires_at,
        qr_value=_build_qr_value(station_id, new_token.token),
    )


# ── Personnel: validate and consume token ────────────────────────────────────

@router.post(
    "/validate",
    response_model=TokenValidateResponse,
    summary="Validate and consume a token, then generate a new one for the station",
)
async def validate_token(body: TokenValidateRequest, db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(QRToken)
        .options(selectinload(QRToken.station))
        .where(QRToken.token == body.token)
    )
    qr = result.scalar_one_or_none()

    if qr is None:
        return TokenValidateResponse(valid=False, message="Token not found")

    if qr.station_id != body.station_id:
        return TokenValidateResponse(valid=False, message="Token does not belong to this station")

    if qr.used:
        return TokenValidateResponse(valid=False, message="Token already used")

    if now >= qr.expires_at:
        return TokenValidateResponse(valid=False, message="Token expired")

    # Token is valid — consume it
    qr.used = True
    qr.used_at = now

    # Issue a new token for the station
    next_token = QRToken(station_id=qr.station_id)
    db.add(next_token)
    await db.flush()

    return TokenValidateResponse(
        valid=True,
        station_id=qr.station_id,
        station_name=qr.station.name,
        station_type=qr.station.type,
        used_at=qr.used_at,
        next_token=next_token.token,
        message="Check-in başarılı",
    )


# ── Admin: list tokens ────────────────────────────────────────────────────────

@router.get(
    "/admin/list",
    response_model=TokenListResponse,
    summary="Admin: list all token statuses",
)
async def list_tokens(
    station_id: uuid.UUID | None = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    query = select(QRToken).options(selectinload(QRToken.station)).order_by(QRToken.created_at.desc())
    if station_id:
        query = query.where(QRToken.station_id == station_id)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    result = await db.execute(query.limit(limit).offset(offset))
    tokens = result.scalars().all()

    items = []
    active_count = used_count = expired_count = 0

    for t in tokens:
        s = _token_status(t)
        if s == "active":
            active_count += 1
        elif s == "used":
            used_count += 1
        else:
            expired_count += 1

        items.append(
            TokenStatusItem(
                id=t.id,
                station_id=t.station_id,
                station_name=t.station.name,
                token=t.token,
                used=t.used,
                created_at=t.created_at,
                used_at=t.used_at,
                expires_at=t.expires_at,
                status=s,
            )
        )

    return TokenListResponse(
        items=items,
        total=total,
        active_count=active_count,
        used_count=used_count,
        expired_count=expired_count,
    )


# ── Admin: cleanup ────────────────────────────────────────────────────────────

@router.post(
    "/admin/cleanup",
    summary="Mark all expired unused tokens as used",
)
async def cleanup_expired(db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(func.count()).where(
            QRToken.expires_at < now,
            QRToken.used.is_(False),
        )
    )
    count = result.scalar_one()

    await db.execute(
        update(QRToken)
        .where(QRToken.expires_at < now, QRToken.used.is_(False))
        .values(used=True, used_at=now)
    )

    return {"cleaned": count, "message": f"{count} expired tokens cleaned up"}
