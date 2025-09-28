"""
Pydantic schemas for item-related operations.
"""

from typing import Optional

from pydantic import BaseModel, Field


class ItemBase(BaseModel):
    """Base item schema."""
    name: str = Field(..., description="Item name")
    price: str = Field(..., description="Item price as string")
    quantity: str = Field(..., description="Item quantity as string")


class ItemCreate(ItemBase):
    """Schema for creating a new item."""
    receiptId: Optional[str] = Field(None, description="ID of the receipt this item belongs to")


class ItemUpdate(BaseModel):
    """Schema for updating an existing item."""
    name: Optional[str] = Field(None, description="Item name")
    price: Optional[str] = Field(None, description="Item price as string")
    quantity: Optional[str] = Field(None, description="Item quantity as string")
    receiptId: Optional[str] = Field(None, description="ID of the receipt this item belongs to")


class Item(ItemBase):
    """Schema for item responses."""
    id: str = Field(..., description="Item ID")
    receiptId: str = Field(..., description="ID of the receipt this item belongs to")

    class Config:
        from_attributes = True