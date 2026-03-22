import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from config import settings
from database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def token_expiry() -> datetime:
    return utcnow() + timedelta(hours=settings.token_ttl_hours)


class Station(Base):
    __tablename__ = "qr_stations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # 'entry' | 'work_station'
    warehouse: Mapped[str | None] = mapped_column(String(255))
    display_url: Mapped[str | None] = mapped_column(String(512), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    tokens: Mapped[list["QRToken"]] = relationship(back_populates="station", cascade="all, delete-orphan")


class QRToken(Base):
    __tablename__ = "qr_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    station_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("qr_stations.id", ondelete="CASCADE"), nullable=False
    )
    token: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    used: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=token_expiry)

    station: Mapped["Station"] = relationship(back_populates="tokens")

    @property
    def is_valid(self) -> bool:
        return not self.used and utcnow() < self.expires_at
