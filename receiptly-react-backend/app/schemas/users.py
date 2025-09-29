"""
User schemas for authentication and user management.
"""

from typing import Optional
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """Base user schema with common fields."""
    name: str
    email: EmailStr


class UserCreate(UserBase):
    """Schema for user registration."""
    password: str


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class User(UserBase):
    """Schema for user response (without password)."""
    id: str

    class Config:
        from_attributes = True


class UserWithPassword(User):
    """Schema for user with password (internal use)."""
    password: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    """Schema for authentication response."""
    success: bool
    user: User
    token: str
    message: Optional[str] = None


class ErrorResponse(BaseModel):
    """Schema for error response."""
    success: bool = False
    error: str