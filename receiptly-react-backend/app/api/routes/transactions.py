"""
API routes for transaction operations.
"""

from typing import List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Query
from prisma import Prisma

from app.core.auth import get_current_user
from app.core.database import get_database
from app.schemas.transactions import (
    Transaction,
    TransactionCreate,
    TransactionUpdate,
    TransactionStats,
    MonthlyStats,
)
from app.schemas.users import User

router = APIRouter()


@router.get("/", response_model=List[Transaction])
async def get_transactions(
    skip: int = 0,
    limit: int = 100,
    type: Optional[str] = Query(None, description="Filter by type: income or expense"),
    category: Optional[str] = Query(None, description="Filter by category"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    db: Prisma = Depends(get_database),
    current_user: User = Depends(get_current_user),
):
    """Get user's transactions with optional filters and pagination."""
    try:
        # Build filter conditions
        where_conditions = {"userId": current_user.id}
        
        if type:
            where_conditions["type"] = type
        if category:
            where_conditions["category"] = category
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["gte"] = start_date
            if end_date:
                date_filter["lte"] = end_date
            where_conditions["date"] = date_filter
        
        transactions = await db.transaction.find_many(
            where=where_conditions,
            skip=skip,
            take=limit,
            order={"date": "desc"},
        )
        return transactions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch transactions: {str(e)}",
        )


@router.get("/stats", response_model=TransactionStats)
async def get_transaction_stats(
    start_date: Optional[datetime] = Query(None, description="Start date for stats"),
    end_date: Optional[datetime] = Query(None, description="End date for stats"),
    db: Prisma = Depends(get_database),
    current_user: User = Depends(get_current_user),
):
    """Get transaction statistics for a date range."""
    try:
        # Build filter conditions
        where_conditions = {"userId": current_user.id}
        
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["gte"] = start_date
            if end_date:
                date_filter["lte"] = end_date
            where_conditions["date"] = date_filter
        
        # Fetch all transactions in range
        transactions = await db.transaction.find_many(where=where_conditions)
        
        # Calculate statistics
        total_income = sum(t.amount for t in transactions if t.type == "income")
        total_expenses = sum(t.amount for t in transactions if t.type == "expense")
        income_count = sum(1 for t in transactions if t.type == "income")
        expense_count = sum(1 for t in transactions if t.type == "expense")
        
        return TransactionStats(
            totalIncome=total_income,
            totalExpenses=total_expenses,
            netBalance=total_income - total_expenses,
            transactionCount=len(transactions),
            incomeCount=income_count,
            expenseCount=expense_count,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch transaction stats: {str(e)}",
        )


@router.get("/monthly", response_model=List[MonthlyStats])
async def get_monthly_stats(
    months: int = Query(12, description="Number of months to retrieve", ge=1, le=24),
    db: Prisma = Depends(get_database),
    current_user: User = Depends(get_current_user),
):
    """Get monthly transaction statistics for the past N months."""
    try:
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months * 31)  # Approximate
        
        # Fetch all transactions in range
        transactions = await db.transaction.find_many(
            where={
                "userId": current_user.id,
                "date": {"gte": start_date, "lte": end_date},
            },
            order={"date": "asc"},
        )
        
        # Group by month
        monthly_data = {}
        for transaction in transactions:
            key = (transaction.date.year, transaction.date.month)
            if key not in monthly_data:
                monthly_data[key] = {
                    "income": 0.0,
                    "expenses": 0.0,
                    "count": 0,
                }
            
            if transaction.type == "income":
                monthly_data[key]["income"] += transaction.amount
            else:
                monthly_data[key]["expenses"] += transaction.amount
            monthly_data[key]["count"] += 1
        
        # Convert to response format
        result = []
        for (year, month), data in sorted(monthly_data.items()):
            result.append(
                MonthlyStats(
                    year=year,
                    month=month,
                    totalIncome=data["income"],
                    totalExpenses=data["expenses"],
                    netBalance=data["income"] - data["expenses"],
                    transactionCount=data["count"],
                )
            )
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch monthly stats: {str(e)}",
        )


@router.get("/{transaction_id}", response_model=Transaction)
async def get_transaction(
    transaction_id: str,
    db: Prisma = Depends(get_database),
    current_user: User = Depends(get_current_user),
):
    """Get a specific transaction by ID (only if owned by current user)."""
    try:
        transaction = await db.transaction.find_unique(where={"id": transaction_id})
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transaction with ID {transaction_id} not found",
            )
        
        # Verify ownership
        if transaction.userId != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transaction with ID {transaction_id} not found",
            )
        
        return transaction
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch transaction: {str(e)}",
        )


@router.post("/", response_model=Transaction, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_data: TransactionCreate,
    db: Prisma = Depends(get_database),
    current_user: User = Depends(get_current_user),
):
    """Create a new transaction for the current user."""
    try:
        transaction = await db.transaction.create(
            data={
                "type": transaction_data.type,
                "amount": transaction_data.amount,
                "category": transaction_data.category,
                "description": transaction_data.description,
                "date": transaction_data.date,
                "userId": current_user.id,
            }
        )
        return transaction
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create transaction: {str(e)}",
        )


@router.put("/{transaction_id}", response_model=Transaction)
async def update_transaction(
    transaction_id: str,
    transaction_data: TransactionUpdate,
    db: Prisma = Depends(get_database),
    current_user: User = Depends(get_current_user),
):
    """Update an existing transaction (only if owned by current user)."""
    try:
        # Check if transaction exists and is owned by user
        existing_transaction = await db.transaction.find_unique(
            where={"id": transaction_id}
        )
        if not existing_transaction or existing_transaction.userId != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transaction with ID {transaction_id} not found",
            )
        
        # Update transaction with only provided fields
        update_data = transaction_data.model_dump(exclude_unset=True)
        transaction = await db.transaction.update(
            where={"id": transaction_id},
            data=update_data,
        )
        return transaction
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update transaction: {str(e)}",
        )


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: str,
    db: Prisma = Depends(get_database),
    current_user: User = Depends(get_current_user),
):
    """Delete a transaction (only if owned by current user)."""
    try:
        # Check if transaction exists and is owned by user
        existing_transaction = await db.transaction.find_unique(
            where={"id": transaction_id}
        )
        if not existing_transaction or existing_transaction.userId != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transaction with ID {transaction_id} not found",
            )
        
        # Delete transaction
        await db.transaction.delete(where={"id": transaction_id})
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete transaction: {str(e)}",
        )
