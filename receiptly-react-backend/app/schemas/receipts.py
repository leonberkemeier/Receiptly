"""
Pydantic schemas for receipt-related operations.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from .items import Item, ItemCreate


class ReceiptBase(BaseModel):
    """Base receipt schema."""
    date: str = Field(..., description="Receipt date as string")
    time: str = Field(..., description="Receipt time as string")
    total: str = Field(..., description="Receipt total as string")
    imageData: Optional[str] = Field(None, description="Base64 encoded image data")


class ReceiptCreate(ReceiptBase):
    """Schema for creating a new receipt."""
    items: List[ItemCreate] = Field(default=[], description="List of items in the receipt")


class ReceiptUpdate(BaseModel):
    """Schema for updating an existing receipt."""
    date: Optional[str] = Field(None, description="Receipt date as string")
    time: Optional[str] = Field(None, description="Receipt time as string")
    total: Optional[str] = Field(None, description="Receipt total as string")
    imageData: Optional[str] = Field(None, description="Base64 encoded image data")


class Receipt(ReceiptBase):
    """Schema for receipt responses."""
    id: str = Field(..., description="Receipt ID")
    createdAt: datetime = Field(..., description="Receipt creation timestamp")
    updatedAt: datetime = Field(..., description="Receipt last update timestamp")
    items: List[Item] = Field(default=[], description="List of items in the receipt")

    class Config:
        from_attributes = True