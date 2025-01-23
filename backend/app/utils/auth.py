import jwt
import datetime
from flask import request, jsonify
from functools import wraps
from ..models.user import User
import os
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

SECRET_KEY = os.getenv('SECRET_KEY', 'your_secret_key_here')
TOKEN_EXPIRATION_MINUTES = int(os.getenv('TOKEN_EXPIRATION_MINUTES', 1440))  # Valor por defecto de 1 día

def generate_token(user):
    payload = {
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(hours=24)  # Token válido por 24 horas
    }
    
    return jwt.encode(
        payload,
        os.getenv('JWT_SECRET_KEY', 'jwt-secret-key'),
        algorithm='HS256'
    )

def decode_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload['sub']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            logger.error("No Authorization header")
            return jsonify({"error": "No authorization header"}), 401
        
        try:
            # Extraer el token del header 'Bearer <token>'
            token = auth_header.split(' ')[1]
            
            # Verificar y decodificar el token
            payload = jwt.decode(
                token,
                os.getenv('JWT_SECRET_KEY', 'jwt-secret-key'),
                algorithms=['HS256']
            )
            
            # Verificar si el token ha expirado
            exp = payload.get('exp')
            if exp and datetime.utcnow().timestamp() > exp:
                logger.error("Token has expired")
                return jsonify({"error": "Token has expired"}), 401
            
            # Añadir el ID del usuario al request
            request.user_id = payload.get('user_id')
            
            return f(*args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            logger.error("Token has expired")
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError as e:
            logger.error(f"Invalid token: {str(e)}")
            return jsonify({"error": "Invalid token"}), 401
        except Exception as e:
            logger.error(f"Error processing token: {str(e)}")
            return jsonify({"error": "Invalid or expired token"}), 401
            
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.user.admin:
            return jsonify({"error": "Admin privileges required"}), 403
        return f(*args, **kwargs)
    return decorated_function 