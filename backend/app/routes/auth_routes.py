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
    code = request.args.get('code')
    logger.debug(f"Received code: {code}")
    
    if not code:
        return jsonify({"error": "No authorization code provided"}), 400

    try:
        token_response = exchange_code_for_token(code)
        logger.debug(f"Token response: {token_response}")
        
        if not token_response:
            return jsonify({"error": "Failed to exchange code for token", "details": "Check server logs"}), 400

        user_info = get_google_user_info(token_response)
        logger.debug(f"User info: {user_info}")
        
        if not user_info:
            return jsonify({"error": "Failed to get user info"}), 400

        email = user_info.get('email')
        if not email:
            return jsonify({"error": "No email found in user info"}), 400

        try:
            # Buscar usuario existente
            user = User.query.filter_by(email=email).first()
            
            if user:
                # Actualizar información del usuario existente
                user.username = user_info.get('name', email.split('@')[0])
                user.google_id = user_info.get('sub')
                user.photoUrl = user_info.get('picture')
                db.session.commit()
            else:
                # Crear nuevo usuario
                user = User(
                    username=user_info.get('name', email.split('@')[0]),
                    email=email,
                    google_id=user_info.get('sub'),
                    photoUrl=user_info.get('picture'),
                    role='pending'
                )
                db.session.add(user)
                db.session.commit()

            # Generar token JWT
            token = generate_token(user)
            
            return jsonify({
                "token": token,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": user_info.get('name', ''),
                    "role": user.role,
                    "photoUrl": user.photoUrl
                }
            })

        except Exception as db_error:
            db.session.rollback()
            logger.error(f"Database error: {str(db_error)}")
            return jsonify({"error": "Database error", "details": str(db_error)}), 500

    except Exception as e:
        logger.error(f"Exception in google_callback: {str(e)}")
        return jsonify({"error": str(e)}), 500

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
