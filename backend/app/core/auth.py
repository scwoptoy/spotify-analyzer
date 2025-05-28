import os
from typing import Optional
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import requests

# Auth0 configuration
AUTH0_DOMAIN = os.getenv('AUTH0_DOMAIN')
AUTH0_AUDIENCE = os.getenv('AUTH0_AUDIENCE', f'https://{AUTH0_DOMAIN}/api/v2/')
ALGORITHMS = ['RS256']

security = HTTPBearer()

class Auth0User:
    def __init__(self, user_id: str, email: str, name: str):
        self.user_id = user_id
        self.email = email
        self.name = name

def get_auth0_public_key():
    """Fetch Auth0 public key for token verification"""
    try:
        url = f'https://{AUTH0_DOMAIN}/.well-known/jwks.json'
        response = requests.get(url)
        jwks = response.json()
        return jwks
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unable to fetch Auth0 public key: {str(e)}")

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Auth0User:
    """Verify and decode Auth0 JWT token"""
    try:
        # Get public key
        jwks = get_auth0_public_key()
        
        # Decode token header to get key ID
        unverified_header = jwt.get_unverified_header(credentials.credentials)
        
        # Find the right key
        rsa_key = {}
        for key in jwks['keys']:
            if key['kid'] == unverified_header['kid']:
                rsa_key = {
                    'kty': key['kty'],
                    'kid': key['kid'],
                    'use': key['use'],
                    'n': key['n'],
                    'e': key['e']
                }
        
        if not rsa_key:
            raise HTTPException(status_code=401, detail='Unable to find appropriate key')
        
        # Verify and decode the token
        payload = jwt.decode(
            credentials.credentials,
            rsa_key,
            algorithms=ALGORITHMS,
            audience=AUTH0_AUDIENCE,
            issuer=f'https://{AUTH0_DOMAIN}/'
        )
        
        # Extract user information
        user_id = payload.get('sub')
        email = payload.get('email', '')
        name = payload.get('name', '')
        
        return Auth0User(user_id=user_id, email=email, name=name)
        
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f'Token verification failed: {str(e)}')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Authentication error: {str(e)}')

# Dependency for protected routes
async def get_current_user(user: Auth0User = Depends(verify_token)) -> Auth0User:
    return user