"""
API routes for receipt operations.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from prisma import Prisma

from app.core.database import get_database
from app.schemas.receipts import Receipt, ReceiptCreate, ReceiptUpdate

router = APIRouter()


@router.get("/", response_model=List[Receipt])
async def get_receipts(
    skip: int = 0,
    limit: int = 100,
    db: Prisma = Depends(get_database),
):
    """Get all receipts with pagination."""
    try:
        receipts = await db.receipt.find_many(
            skip=skip,
            take=limit,
            include={"items": True},
            order={"createdAt": "desc"},
        )
        return receipts
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch receipts: {str(e)}",
        )


@router.get("/{receipt_id}", response_model=Receipt)
async def get_receipt(
    receipt_id: str,
    db: Prisma = Depends(get_database),
):
    """Get a specific receipt by ID."""
    try:
        receipt = await db.receipt.find_unique(
            where={"id": receipt_id},
            include={"items": True},
        )
        if not receipt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Receipt with ID {receipt_id} not found",
            )
        return receipt
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch receipt: {str(e)}",
        )


@router.post("/", response_model=Receipt, status_code=status.HTTP_201_CREATED)
async def create_receipt(
    receipt_data: ReceiptCreate,
    db: Prisma = Depends(get_database),
):
    """Create a new receipt with items."""
    try:
        # Extract items data
        items_data = [item.model_dump(exclude={"receiptId"}) for item in receipt_data.items]
        
        # Create receipt with items
        receipt = await db.receipt.create(
            data={
                "date": receipt_data.date,
                "time": receipt_data.time,
                "total": receipt_data.total,
                "imageData": receipt_data.imageData,
                "items": {
                    "create": items_data
                } if items_data else {},
            },
            include={"items": True},
        )
        return receipt
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create receipt: {str(e)}",
        )


@router.put("/{receipt_id}", response_model=Receipt)
async def update_receipt(
    receipt_id: str,
    receipt_data: ReceiptUpdate,
    db: Prisma = Depends(get_database),
):
    """Update an existing receipt."""
    try:
        # Check if receipt exists
        existing_receipt = await db.receipt.find_unique(where={"id": receipt_id})
        if not existing_receipt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Receipt with ID {receipt_id} not found",
            )
        
        # Update receipt with only provided fields
        update_data = receipt_data.model_dump(exclude_unset=True)
        receipt = await db.receipt.update(
            where={"id": receipt_id},
            data=update_data,
            include={"items": True},
        )
        return receipt
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update receipt: {str(e)}",
        )


@router.delete("/{receipt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_receipt(
    receipt_id: str,
    db: Prisma = Depends(get_database),
):
    """Delete a receipt and all its items."""
    try:
        # Check if receipt exists
        existing_receipt = await db.receipt.find_unique(where={"id": receipt_id})
        if not existing_receipt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Receipt with ID {receipt_id} not found",
            )
        
        # Delete receipt (items will be deleted due to cascade)
        await db.receipt.delete(where={"id": receipt_id})
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete receipt: {str(e)}",
        )