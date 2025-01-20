from flask import Blueprint, request, jsonify, redirect, url_for
from backend.models.user import User
from backend.utils.auth import generate_token
from backend.utils.google_auth import exchange_code_for_token, get_google_user_info
from backend import db
from google.oauth2 import id_token
from google.auth.transport import requests
import os

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

@auth_bp.route('/auth/google/callback')
def google_callback():
    code = request.args.get('code')
    if not code:
        return jsonify({'error': 'No authorization code provided'}), 400

    try:
        # Verificar el token de ID
        idinfo = id_token.verify_oauth2_token(
            code, 
            requests.Request(), 
            os.getenv('GOOGLE_CLIENT_ID')
        )

        # Obtener información del usuario
        email = idinfo['email']
        name = idinfo.get('name', '')
        
        # Aquí deberías crear o actualizar el usuario en tu base de datos
        # y generar un token JWT para tu aplicación
        
        # Redirigir al frontend con el token
        return redirect(f"{os.getenv('FRONTEND_URL')}/dashboard?token={token}")

    except ValueError:
        return jsonify({'error': 'Invalid token'}), 401

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
