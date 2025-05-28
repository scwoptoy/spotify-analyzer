from fastapi import APIRouter, Depends
from app.core.auth import get_current_user, Auth0User

router = APIRouter()

@router.get('/me')
async def get_user_profile(current_user: Auth0User = Depends(get_current_user)):
    """Get current user profile"""
    return {
        'user_id': current_user.user_id,
        'email': current_user.email,
        'name': current_user.name,
        'message': 'Authentication successful!'
    }

@router.get('/protected')
async def protected_endpoint(current_user: Auth0User = Depends(get_current_user)):
    """Example protected endpoint"""
    return {
        'message': f'Hello {current_user.name}! This is a protected endpoint.',
        'user_id': current_user.user_id
    }