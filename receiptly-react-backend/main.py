"""
Main FastAPI application entry point for Receiptly backend.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prisma import Prisma

from app.api.routes import receipts, items
from app.core.config import get_settings
from app.core.database import set_database

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get application settings
settings = get_settings()

# Global Prisma instance
db = Prisma()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown."""
    # Startup
    logger.info("Starting up Receiptly backend...")
    await db.connect()
    # Set the global database instance for dependency injection
    set_database(db)
    logger.info("Database connected successfully")
    yield
    # Shutdown
    logger.info("Shutting down Receiptly backend...")
    await db.disconnect()
    logger.info("Database disconnected")


# Create FastAPI instance
app = FastAPI(
    title="Receiptly API",
    description="Backend API for the Receiptly receipt management application",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(receipts.router, prefix="/api/receipts", tags=["receipts"])
app.include_router(items.router, prefix="/api/items", tags=["items"])


@app.get("/")
async def root():
    """Root endpoint for health check."""
    return {"message": "Receiptly API is running!", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "database": "connected"}


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info",
    )