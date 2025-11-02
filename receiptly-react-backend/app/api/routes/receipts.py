"""
API routes for receipt operations.
"""

from typing import List
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from prisma import Prisma

from app.core.auth import get_current_user
from app.core.database import get_database
from app.schemas.receipts import Receipt, ReceiptCreate, ReceiptUpdate
from app.schemas.users import User

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=List[Receipt])
async def get_receipts(
    skip: int = 0,
    limit: int = 100,
    db: Prisma = Depends(get_database),
    current_user: User = Depends(get_current_user),
):
    """Get user's receipts with pagination."""
    try:
        receipts = await db.receipt.find_many(
            where={"userId": current_user.id},
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
    current_user: User = Depends(get_current_user),
):
    """Get a specific receipt by ID (only if owned by current user)."""
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
        
        # Verify ownership
        if receipt.userId != current_user.id:
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
    current_user: User = Depends(get_current_user),
):
    """Create a new receipt with items for the current user."""
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
                "userId": current_user.id,
                "items": {
                    "create": items_data
                } if items_data else {},
            },
            include={"items": True},
        )
        
        # Auto-create an expense transaction for this receipt
        try:
            from datetime import datetime
            import logging
            
            logger_tx = logging.getLogger(__name__)
            
            # Parse the receipt date - handle both ISO format and simple date strings
            try:
                if 'T' in receipt_data.date:
                    # ISO format datetime string
                    receipt_datetime = datetime.fromisoformat(receipt_data.date.replace('Z', '+00:00'))
                else:
                    # Simple date string (YYYY-MM-DD)
                    receipt_datetime = datetime.strptime(receipt_data.date, '%Y-%m-%d')
            except (ValueError, AttributeError) as parse_error:
                logger_tx.warning(f"Could not parse date '{receipt_data.date}': {parse_error}, using current time")
                receipt_datetime = datetime.now()
            
            logger_tx.info(f"Creating transaction for receipt: user={current_user.id}, amount={receipt_data.total}, date={receipt_datetime}")
            
            # Create transaction linked to this receipt
            transaction = await db.transaction.create(
                data={
                    "userId": current_user.id,
                    "type": "expense",
                    "amount": float(receipt_data.total),
                    "category": "Receipt",
                    "description": f"Receipt from {receipt_datetime.strftime('%Y-%m-%d')}",
                    "date": receipt_datetime,
                    "receiptId": receipt.id,
                }
            )
            logger_tx.info(f"Transaction created successfully: {transaction.id}")
        except Exception as transaction_error:
            # Log but don't fail the receipt creation
            import traceback
            logger_tx.error(f"Failed to create transaction for receipt: {transaction_error}")
            logger_tx.error(traceback.format_exc())
        
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
    current_user: User = Depends(get_current_user),
):
    """Update an existing receipt (only if owned by current user)."""
    try:
        # Check if receipt exists and is owned by user
        existing_receipt = await db.receipt.find_unique(where={"id": receipt_id})
        if not existing_receipt or existing_receipt.userId != current_user.id:
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
    current_user: User = Depends(get_current_user),
):
    """Delete a receipt and all its items (only if owned by current user)."""
    try:
        # Check if receipt exists and is owned by user
        existing_receipt = await db.receipt.find_unique(where={"id": receipt_id})
        if not existing_receipt or existing_receipt.userId != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Receipt with ID {receipt_id} not found",
            )
        
        # Delete linked transactions first
        try:
            deleted_transactions = await db.transaction.delete_many(
                where={
                    "receiptId": receipt_id,
                    "userId": current_user.id,
                }
            )
            logger.info(f"Deleted {deleted_transactions} transactions linked to receipt {receipt_id}")
        except Exception as tx_error:
            logger.warning(f"Failed to delete transactions for receipt {receipt_id}: {tx_error}")
        
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
