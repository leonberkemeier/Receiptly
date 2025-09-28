"""
Database connection and utility functions.
"""

from prisma import Prisma

# This will be set by main.py with the connected instance
db: Prisma = None


def set_database(database: Prisma):
    """Set the global database instance."""
    global db
    db = database


async def get_database() -> Prisma:
    """Get the database connection."""
    if db is None:
        raise RuntimeError("Database not initialized. Call set_database() first.")
    return db
