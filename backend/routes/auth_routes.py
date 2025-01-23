from flask import Blueprint, request, jsonify, redirect, url_for
from models import User
from utils.auth import generate_token
from utils.google_auth import exchange_code_for_token, get_google_user_info
from extensions import db
from google.oauth2 import id_token
from google.auth.transport import requests
import os
import jwt
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

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

@auth_bp.route('/google/callback')
def google_callback():
    code = request.args.get('code')
    
    if not code:
        return jsonify({'error': 'No authorization code provided'}), 400

    try:
        # Intercambiar el código por token
        token_data = exchange_code_for_token(
            code, 
            'http://localhost:3000/auth/callback'
        )
        
        if 'error' in token_data:
            return jsonify({'error': token_data['error']}), 401

        # Obtener información del usuario
        user_info = get_google_user_info(token_data['id_token'])
        if not user_info:
            return jsonify({'error': 'Failed to get user info'}), 401

        # Buscar o crear usuario
        user = User.query.filter_by(email=user_info['email']).first()
        is_new_user = user is None

        if not user:
            user = User(
                email=user_info['email'],
                username=user_info['name'],
                photoUrl=user_info['picture'],
                role='pending'
            )
            db.session.add(user)
            db.session.commit()

        # Actualizar photoUrl si ha cambiado
        elif user.photoUrl != user_info['picture']:
            user.photoUrl = user_info['picture']
            db.session.commit()

        # Generar JWT
        token = generate_token(user)
        
        return jsonify({
            'token': token,
            'user': {
                'email': user.email,
                'name': user.username,
                'role': user.role,
                'photoUrl': user.photoUrl
            },
            'isNewUser': is_new_user
        })

    except Exception as e:
        print(f"Error in callback: {str(e)}")
        return jsonify({'error': str(e)}), 401

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
