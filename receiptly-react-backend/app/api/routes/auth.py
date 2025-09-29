"""
Authentication routes for user login and registration.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from prisma import Prisma
from prisma.errors import UniqueViolationError

from app.core.auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    get_password_hash,
)
from app.core.database import get_database
from app.schemas.users import (
    AuthResponse,
    ErrorResponse,
    User,
    UserCreate,
    UserLogin,
)

router = APIRouter()


@router.post("/register", response_model=AuthResponse)
async def register(
    user_data: UserCreate,
    db: Prisma = Depends(get_database),
):
    """Register a new user."""
    try:
        # Check if user already exists
        existing_user = await db.user.find_unique(where={"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash the password
        hashed_password = get_password_hash(user_data.password)
        
        # Create the user
        user = await db.user.create(
            data={
                "name": user_data.name,
                "email": user_data.email,
                "password": hashed_password,
            }
        )
        
        # Create access token
        access_token = create_access_token(data={"sub": user.id})
        
        # Return response
        return AuthResponse(
            success=True,
            user=User(
                id=user.id,
                name=user.name,
                email=user.email,
            ),
            token=access_token,
            message="User registered successfully"
        )
        
    except UniqueViolationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )


@router.post("/login", response_model=AuthResponse)
async def login(
    user_credentials: UserLogin,
    db: Prisma = Depends(get_database),
):
    """Authenticate user and return access token."""
    try:
        # Authenticate user
        user = await authenticate_user(
            email=user_credentials.email,
            password=user_credentials.password,
            db=db
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Create access token
        access_token = create_access_token(data={"sub": user.id})
        
        # Return response
        return AuthResponse(
            success=True,
            user=user,
            token=access_token,
            message="Login successful"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )


@router.get("/me", response_model=User)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    """Get current user information."""
    return current_user


@router.post("/logout")
async def logout():
    """Logout endpoint (client-side token removal)."""
    return {"message": "Logout successful. Please remove the token from client storage."}