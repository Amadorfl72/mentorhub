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
        logger.debug(f"Received code: {code[:10]}...")  # Solo mostramos los primeros 10 caracteres por seguridad

        if not code:
            logger.error("No authorization code provided")
            return jsonify({"error": "No authorization code provided"}), 400

        # Obtener el token usando el código
        logger.debug("Attempting to exchange code for token...")
        token_info = exchange_code_for_token(code)
        logger.debug(f"Token info received: {bool(token_info)}")

        if not token_info:
            logger.error("Failed to exchange code for token")
            return jsonify({"error": "Failed to exchange code for token", "details": "Check server logs"}), 400

        # Obtener información del usuario
        logger.debug("Attempting to get user info...")
        id_token = token_info.get('id_token')
        logger.debug(f"ID token present: {bool(id_token)}")
        
        user_info = get_google_user_info(id_token)
        logger.debug(f"User info received: {bool(user_info)}")

        if not user_info:
            logger.error("Failed to get user info")
            return jsonify({"error": "Failed to get user info", "details": "Invalid token"}), 400

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
                "role": user.role
            }
        })

    except Exception as e:
        logger.error(f"Error in Google callback: {str(e)}")
        return jsonify({"error": "Authentication failed", "details": str(e)}), 400

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
