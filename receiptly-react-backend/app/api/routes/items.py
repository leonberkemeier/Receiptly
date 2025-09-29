"""
API routes for item operations.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from prisma import Prisma

from app.core.auth import get_current_user
from app.core.database import get_database
from app.schemas.items import Item, ItemCreate, ItemUpdate
from app.schemas.users import User

router = APIRouter()


async def verify_receipt_ownership(receipt_id: str, user_id: str, db: Prisma) -> bool:
    """Verify that a receipt belongs to the given user."""
    receipt = await db.receipt.find_unique(where={"id": receipt_id})
    return receipt and receipt.userId == user_id


@router.get("/", response_model=List[Item])
async def get_items(
    skip: int = 0,
    limit: int = 100,
    receipt_id: str = None,
    db: Prisma = Depends(get_database),
    current_user: User = Depends(get_current_user),
):
    """Get items with optional filtering by receipt ID (only for user's receipts)."""
    try:
        where_clause = {}
        if receipt_id:
            # Verify that the receipt belongs to the current user
            if not await verify_receipt_ownership(receipt_id, current_user.id, db):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Receipt with ID {receipt_id} not found",
                )
            where_clause["receiptId"] = receipt_id
        else:
            # If no receipt_id specified, only get items from user's receipts
            user_receipts = await db.receipt.find_many(
                where={"userId": current_user.id},
                select={"id": True},
            )
            receipt_ids = [receipt.id for receipt in user_receipts]
            if receipt_ids:
                where_clause["receiptId"] = {"in": receipt_ids}
            else:
                # User has no receipts, return empty list
                return []
            
        items = await db.item.find_many(
            where=where_clause,
            skip=skip,
            take=limit,
        )
        return items
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch items: {str(e)}",
        )


@router.get("/{item_id}", response_model=Item)
async def get_item(
    item_id: str,
    db: Prisma = Depends(get_database),
    current_user: User = Depends(get_current_user),
):
    """Get a specific item by ID (only if it belongs to user's receipt)."""
    try:
        item = await db.item.find_unique(
            where={"id": item_id},
            include={"receipt": True},
        )
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item with ID {item_id} not found",
            )
        
        # Verify that the item's receipt belongs to the current user
        if not await verify_receipt_ownership(item.receiptId, current_user.id, db):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item with ID {item_id} not found",
            )
        
        return item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch item: {str(e)}",
        )


@router.post("/", response_model=Item, status_code=status.HTTP_201_CREATED)
async def create_item(
    item_data: ItemCreate,
    db: Prisma = Depends(get_database),
    current_user: User = Depends(get_current_user),
):
    """Create a new item (only for user's receipts)."""
    try:
        # Verify that the receipt exists and belongs to the current user
        if item_data.receiptId:
            if not await verify_receipt_ownership(item_data.receiptId, current_user.id, db):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Receipt with ID {item_data.receiptId} not found",
                )
        
        item = await db.item.create(data=item_data.model_dump())
        return item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create item: {str(e)}",
        )


@router.put("/{item_id}", response_model=Item)
async def update_item(
    item_id: str,
    item_data: ItemUpdate,
    db: Prisma = Depends(get_database),
    current_user: User = Depends(get_current_user),
):
    """Update an existing item (only if it belongs to user's receipt)."""
    try:
        # Check if item exists and belongs to user's receipt
        existing_item = await db.item.find_unique(where={"id": item_id})
        if not existing_item or not await verify_receipt_ownership(existing_item.receiptId, current_user.id, db):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item with ID {item_id} not found",
            )
        
        # Verify that the receipt exists and belongs to user if receiptId is being updated
        update_data = item_data.model_dump(exclude_unset=True)
        if "receiptId" in update_data and update_data["receiptId"]:
            if not await verify_receipt_ownership(update_data["receiptId"], current_user.id, db):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Receipt with ID {update_data['receiptId']} not found",
                )
        
        item = await db.item.update(
            where={"id": item_id},
            data=update_data,
        )
        return item
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update item: {str(e)}",
        )


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: str,
    db: Prisma = Depends(get_database),
    current_user: User = Depends(get_current_user),
):
    """Delete an item (only if it belongs to user's receipt)."""
    try:
        # Check if item exists and belongs to user's receipt
        existing_item = await db.item.find_unique(where={"id": item_id})
        if not existing_item or not await verify_receipt_ownership(existing_item.receiptId, current_user.id, db):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item with ID {item_id} not found",
            )
        
        await db.item.delete(where={"id": item_id})
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete item: {str(e)}",
        )