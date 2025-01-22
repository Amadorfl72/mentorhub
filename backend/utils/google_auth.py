from google.oauth2 import id_token
from google.auth.transport import requests
import requests as http_requests
import os

def exchange_code_for_token(code, redirect_uri):
    token_endpoint = 'https://oauth2.googleapis.com/token'
    data = {
        'code': code,
        'client_id': os.getenv('GOOGLE_CLIENT_ID'),
        'client_secret': os.getenv('GOOGLE_CLIENT_SECRET'),
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code'
    }
    
    response = http_requests.post(token_endpoint, data=data)
    return response.json()

def get_google_user_info(id_token_str):
    try:
        idinfo = id_token.verify_oauth2_token(
            id_token_str,
            requests.Request(),
            os.getenv('GOOGLE_CLIENT_ID')
        )
        return {
            'email': idinfo['email'],
            'name': idinfo.get('name', ''),
            'picture': idinfo.get('picture', '')
        }
    except ValueError:
        return None 