from flask import Blueprint, request, jsonify, redirect, url_for
from ..models.user import User
from ..utils.auth import generate_token
from ..utils.google_auth import exchange_code_for_token, get_google_user_info
from ..extensions import db
from google.oauth2 import id_token
from google.auth.transport import requests
import os
import jwt
from datetime import datetime, timedelta
import logging

auth_bp = Blueprint('auth', __name__)

# Configurar logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    # Aquí podrías verificar la contraseña si no usas SSO
    token = generate_token(user)
    return jsonify({"token": token})

@auth_bp.route('/auth/google/callback')
def google_callback():
    try:
        code = request.args.get('code')
        logger.info(f"Received auth code: {code[:10]}...")

        if not code:
            logger.error("No authorization code provided")
            return jsonify({"error": "No authorization code provided"}), 400

        # Obtener el token usando el código
        token_info = exchange_code_for_token(code)
        
        if not token_info:
            logger.error("Failed to exchange code for token - token_info is None")
            return jsonify({
                "error": "Failed to exchange code for token",
                "details": "Token exchange failed"
            }), 400

        # Log del token_info (sin mostrar datos sensibles)
        logger.info(f"Token info received: {bool(token_info)}")
        logger.info(f"Token info keys: {token_info.keys() if token_info else None}")

        id_token = token_info.get('id_token')
        if not id_token:
            logger.error("No id_token in token_info")
            return jsonify({
                "error": "Invalid token response",
                "details": "No id_token present"
            }), 400

        user_info = get_google_user_info(id_token)
        if not user_info:
            logger.error("Failed to get user info from token")
            return jsonify({
                "error": "Failed to get user info",
                "details": "Could not verify token"
            }), 400

        # Buscar o crear usuario
        user = User.query.filter_by(email=user_info['email']).first()
        if not user:
            user = User(
                email=user_info['email'],
                username=user_info.get('name', ''),
                photoUrl=user_info.get('picture'),
                role='pending'
            )
            db.session.add(user)
        else:
            # Actualizar la foto del usuario existente si ha cambiado
            if user.photoUrl != user_info.get('picture'):
                user.photoUrl = user_info.get('picture')

        db.session.commit()

        # Generar JWT
        token = generate_token(user)

        return jsonify({
            "token": token,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user_info.get('name', ''),
                "photoUrl": user_info.get('picture'),
                "role": user.role,
                "skills": user.skills,
                "interests": user.interests
            }
        })

    except Exception as e:
        logger.exception("Error in Google callback")
        return jsonify({
            "error": "Authentication failed",
            "details": str(e)
        }), 400

@auth_bp.route('/verify-token', methods=['POST'])
def verify_token():
    token = request.json.get('token')
    if not token:
        return jsonify({'error': 'No token provided'}), 401

    try:
        # Verificar el token JWT de tu aplicación
        # Implementar la lógica de verificación aquí
        return jsonify({'valid': True})
    except:
        return jsonify({'error': 'Invalid token'}), 401

@auth_bp.route('/auth/debug-token', methods=['GET'])
def debug_token():
    auth_header = request.headers.get('Authorization')
    
    if not auth_header:
        return jsonify({"error": "No Authorization header"}), 401
    
    try:
        # Extraer el token del header 'Bearer <token>'
        token = auth_header.split(' ')[1]
        
        # Imprimir información sobre el token para depuración
        logger.info(f"Token recibido: {token[:20]}...")
        
        # Intentar decodificar con ambas claves
        try:
            payload_jwt_key = jwt.decode(
                token,
                os.getenv('JWT_SECRET_KEY', 'jwt-secret-key'),
                algorithms=['HS256']
            )
            logger.info(f"Decodificación exitosa con JWT_SECRET_KEY: {payload_jwt_key}")
        except Exception as e:
            logger.error(f"Error decodificando con JWT_SECRET_KEY: {str(e)}")
            payload_jwt_key = None
            
        try:
            payload_secret_key = jwt.decode(
                token,
                SECRET_KEY,
                algorithms=['HS256']
            )
            logger.info(f"Decodificación exitosa con SECRET_KEY: {payload_secret_key}")
        except Exception as e:
            logger.error(f"Error decodificando con SECRET_KEY: {str(e)}")
            payload_secret_key = None
            
        return jsonify({
            "token_info": {
                "decoded_with_jwt_key": payload_jwt_key is not None,
                "decoded_with_secret_key": payload_secret_key is not None,
                "payload_jwt_key": payload_jwt_key,
                "payload_secret_key": payload_secret_key
            }
        })
            
    except Exception as e:
        logger.error(f"Error general procesando token: {str(e)}")
        return jsonify({"error": "Error processing token", "details": str(e)}), 400
