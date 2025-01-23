import os
import requests
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
import logging

# Configurar logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
# Asegurarnos de que esto coincide EXACTAMENTE con lo configurado en Google Cloud Console
REDIRECT_URI = 'http://localhost:3000/auth/callback'  # Actualizado para coincidir con el frontend

def exchange_code_for_token(code):
    token_endpoint = "https://oauth2.googleapis.com/token"
    
    data = {
        'code': code,
        'client_id': GOOGLE_CLIENT_ID,
        'client_secret': GOOGLE_CLIENT_SECRET,
        'redirect_uri': REDIRECT_URI,
        'grant_type': 'authorization_code'
    }
    
    logger.info(f"Attempting token exchange with code: {code[:10]}...")
    logger.info(f"Using redirect URI: {REDIRECT_URI}")
    
    try:
        response = requests.post(token_endpoint, data=data)
        logger.info(f"Token exchange response status: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"Token exchange failed: {response.text}")
            return None
            
        return response.json()
    except Exception as e:
        logger.exception("Exception during token exchange")
        return None

def get_google_user_info(id_token):
    try:
        # Verify the token first
        idinfo = google_id_token.verify_oauth2_token(
            id_token, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID
        )

        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')

        return {
            'email': idinfo['email'],
            'name': idinfo.get('name', ''),
            'picture': idinfo.get('picture', '')
        }
    except Exception as e:
        logger.error(f"Error getting Google user info: {str(e)}")
        return None 