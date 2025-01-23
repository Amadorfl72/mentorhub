import os
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import logging

# Configurar logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
# El REDIRECT_URI debe coincidir exactamente con el configurado en Google Cloud Console
REDIRECT_URI = 'http://localhost:3000/auth/callback'

def exchange_code_for_token(code):
    token_endpoint = "https://oauth2.googleapis.com/token"
    
    data = {
        'code': code,
        'client_id': GOOGLE_CLIENT_ID,
        'client_secret': GOOGLE_CLIENT_SECRET,
        'redirect_uri': REDIRECT_URI,
        'grant_type': 'authorization_code'
    }
    
    logger.debug(f"Exchanging code for token with data: {data}")
    
    try:
        response = requests.post(token_endpoint, data=data)
        logger.debug(f"Token exchange response status: {response.status_code}")
        logger.debug(f"Token exchange response: {response.text}")
        
        if response.status_code == 200:
            return response.json()
        else:
            logger.error(f"Failed to exchange token: {response.text}")
            return None
    except Exception as e:
        logger.error(f"Exception during token exchange: {str(e)}")
        return None

def get_google_user_info(token_response):
    try:
        logger.debug(f"Getting user info with token response: {token_response}")
        
        # Verificar el token ID
        idinfo = id_token.verify_oauth2_token(
            token_response['id_token'], 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        logger.debug(f"User info obtained: {idinfo}")
        return idinfo
    except Exception as e:
        logger.error(f"Exception getting user info: {str(e)}")
        return None 