from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import engine, Base
from routers import stations, tokens


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if they don't exist (prefer Alembic migrations in production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="ShiftTrack QR Token API",
    description="QR token generation, validation, and station management",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stations.router)
app.include_router(tokens.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "qr-token-api"}
