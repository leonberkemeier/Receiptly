"""
Pydantic schemas for transaction-related operations.
"""

from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


class TransactionBase(BaseModel):
    """Base transaction schema."""
    type: Literal["income", "expense"] = Field(..., description="Transaction type")
    amount: float = Field(..., gt=0, description="Transaction amount (must be positive)")
    category: str = Field(..., min_length=1, description="Transaction category")
    description: Optional[str] = Field(None, description="Transaction description")
    date: datetime = Field(..., description="Transaction date")
    receiptId: Optional[str] = Field(None, description="Optional receipt ID linking to a receipt")


class TransactionCreate(TransactionBase):
    """Schema for creating a new transaction."""
    pass


class TransactionUpdate(BaseModel):
    """Schema for updating an existing transaction."""
    type: Optional[Literal["income", "expense"]] = Field(None, description="Transaction type")
    amount: Optional[float] = Field(None, gt=0, description="Transaction amount")
    category: Optional[str] = Field(None, min_length=1, description="Transaction category")
    description: Optional[str] = Field(None, description="Transaction description")
    date: Optional[datetime] = Field(None, description="Transaction date")
    receiptId: Optional[str] = Field(None, description="Optional receipt ID linking to a receipt")


class Transaction(TransactionBase):
    """Schema for transaction responses."""
    id: str = Field(..., description="Transaction ID")
    userId: str = Field(..., description="User ID")
    createdAt: datetime = Field(..., description="Transaction creation timestamp")
    updatedAt: datetime = Field(..., description="Transaction last update timestamp")

    class Config:
        from_attributes = True


class TransactionStats(BaseModel):
    """Schema for transaction statistics."""
    totalIncome: float = Field(..., description="Total income for period")
    totalExpenses: float = Field(..., description="Total expenses for period")
    netBalance: float = Field(..., description="Net balance (income - expenses)")
    transactionCount: int = Field(..., description="Total number of transactions")
    incomeCount: int = Field(..., description="Number of income transactions")
    expenseCount: int = Field(..., description="Number of expense transactions")


class MonthlyStats(BaseModel):
    """Schema for monthly transaction statistics."""
    year: int
    month: int
    totalIncome: float
    totalExpenses: float
    netBalance: float
    transactionCount: int
