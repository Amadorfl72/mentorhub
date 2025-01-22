import jwt
import datetime
from flask import request, jsonify
from functools import wraps
from models.user import User
import os

SECRET_KEY = os.getenv('SECRET_KEY', 'your_secret_key_here')
TOKEN_EXPIRATION_MINUTES = int(os.getenv('TOKEN_EXPIRATION_MINUTES', 1440))  # Valor por defecto de 1 día

def generate_token(user):
    payload = {
        'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=TOKEN_EXPIRATION_MINUTES),
        'iat': datetime.datetime.utcnow(),
        'sub': user.id
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

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
            return jsonify({"error": "Authentication required"}), 401
        
        token = auth_header.split(" ")[1]
        user_id = decode_token(token)
        
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        request.user = user
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.user.admin:
            return jsonify({"error": "Admin privileges required"}), 403
        return f(*args, **kwargs)
    return decorated_function 