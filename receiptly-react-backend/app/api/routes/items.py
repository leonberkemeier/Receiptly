"""
API routes for item operations.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from prisma import Prisma

from app.core.database import get_database
from app.schemas.items import Item, ItemCreate, ItemUpdate

router = APIRouter()


@router.get("/", response_model=List[Item])
async def get_items(
    skip: int = 0,
    limit: int = 100,
    receipt_id: str = None,
    db: Prisma = Depends(get_database),
):
    """Get all items with optional filtering by receipt ID."""
    try:
        where_clause = {}
        if receipt_id:
            where_clause["receiptId"] = receipt_id
            
        items = await db.item.find_many(
            where=where_clause,
            skip=skip,
            take=limit,
        )
        return items
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch items: {str(e)}",
        )


@router.get("/{item_id}", response_model=Item)
async def get_item(
    item_id: str,
    db: Prisma = Depends(get_database),
):
    """Get a specific item by ID."""
    try:
        item = await db.item.find_unique(where={"id": item_id})
        if not item:
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
):
    """Create a new item."""
    try:
        # Verify that the receipt exists if receiptId is provided
        if item_data.receiptId:
            receipt = await db.receipt.find_unique(where={"id": item_data.receiptId})
            if not receipt:
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
):
    """Update an existing item."""
    try:
        # Check if item exists
        existing_item = await db.item.find_unique(where={"id": item_id})
        if not existing_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item with ID {item_id} not found",
            )
        
        # Verify that the receipt exists if receiptId is being updated
        update_data = item_data.model_dump(exclude_unset=True)
        if "receiptId" in update_data and update_data["receiptId"]:
            receipt = await db.receipt.find_unique(where={"id": update_data["receiptId"]})
            if not receipt:
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
):
    """Delete an item."""
    try:
        # Check if item exists
        existing_item = await db.item.find_unique(where={"id": item_id})
        if not existing_item:
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