from flask import Blueprint, request, jsonify, redirect, url_for
from ..models.user import User
from ..utils.auth import generate_token, JWT_SECRET_KEY
from ..utils.google_auth import exchange_code_for_token, get_google_user_info
from ..utils.image_utils import download_and_convert_image
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
    return jsonify({
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.username,
            "photoUrl": user.photoUrl,
            "photoData": user.photo_data,  # Enviar la imagen en base64
            "role": user.role,
            "skills": user.skills,
            "interests": user.interests,
            "admin": user.admin
        }
    })

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
        
        # Obtener la URL de la foto
        photo_url = user_info.get('picture')
        
        # Verificar si necesitamos actualizar la foto
        update_photo = False
        
        if not user:
            # Crear nuevo usuario
            user = User(
                email=user_info['email'],
                username=user_info.get('name', ''),
                photoUrl=photo_url,
                role='pending'
            )
            db.session.add(user)
            update_photo = True
        else:
            # Actualizar la URL de la foto si ha cambiado
            if user.photoUrl != photo_url:
                user.photoUrl = photo_url
                update_photo = True
            
            # Si han pasado más de 7 días desde la última actualización, actualizar la foto
            if user.photo_updated_at is None or (datetime.now() - user.photo_updated_at).days > 7:
                update_photo = True
        
        # Si necesitamos actualizar la foto, descargarla y convertirla
        if update_photo and photo_url:
            logger.info(f"Updating photo for user {user.email}")
            photo_data = download_and_convert_image(photo_url)
            if photo_data:
                user.photo_data = photo_data
                user.photo_updated_at = datetime.now()
                logger.info(f"Photo updated successfully for user {user.email}")
            else:
                logger.error(f"Failed to download and convert image for user {user.email}")
        
        db.session.commit()

        # Generar JWT
        token = generate_token(user)

        return jsonify({
            "token": token,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.username,
                "photoUrl": user.photoUrl,
                "photoData": user.photo_data,  # Enviar la imagen en base64
                "role": user.role,
                "skills": user.skills,
                "interests": user.interests,
                "admin": user.admin
            }
        })
    except Exception as e:
        logger.error(f"Error in Google callback: {str(e)}")
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/verify-token', methods=['POST'])
def verify_token():
    token = request.json.get('token')
    if not token:
        return jsonify({"valid": False, "error": "No token provided"}), 400
    
    try:
        # Decodificar el token usando la misma clave que se usa para generarlo
        from ..utils.auth import JWT_SECRET_KEY  # Importar la clave desde auth.py
        
        # Verificar que el token no ha expirado
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
        
        # Verificar que el token no ha expirado
        exp = payload.get('exp')
        if not exp or datetime.fromtimestamp(exp) < datetime.now():
            return jsonify({"valid": False, "error": "Token expired"}), 401
        
        # Obtener el usuario
        user_id = payload.get('user_id')  # Cambiar 'sub' por 'user_id' para que coincida con generate_token
        if not user_id:
            return jsonify({"valid": False, "error": "Invalid token"}), 401
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"valid": False, "error": "User not found"}), 401
        
        # Devolver información del usuario
        return jsonify({
            "valid": True,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.username,
                "photoUrl": user.photoUrl,
                "photoData": user.photo_data,
                "role": user.role,
                "skills": user.skills,
                "interests": user.interests,
                "admin": user.admin
            }
        })
    except jwt.ExpiredSignatureError:
        return jsonify({"valid": False, "error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"valid": False, "error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"Error verifying token: {str(e)}")
        return jsonify({"valid": False, "error": str(e)}), 500

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

@auth_bp.route('/test-token', methods=['GET'])
def test_token():
    try:
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({"valid": False, "error": "No authorization header"}), 401
        
        # Extraer el token del header 'Bearer <token>'
        token = auth_header.split(' ')[1]
        
        # Información sobre el token
        token_info = {
            "token_length": len(token),
            "token_preview": token[:20] + "...",
            "is_jwt_format": len(token.split('.')) == 3
        }
        
        # Intentar decodificar el token
        try:
            payload = jwt.decode(
                token,
                os.getenv('JWT_SECRET_KEY', 'jwt-secret-key'),
                algorithms=['HS256']
            )
            
            # Si llegamos aquí, el token es válido
            return jsonify({
                "valid": True,
                "token_info": token_info,
                "payload": {
                    "user_id": payload.get('user_id'),
                    "exp": payload.get('exp')
                }
            })
        except Exception as e:
            # El token no es válido
            return jsonify({
                "valid": False,
                "token_info": token_info,
                "error": str(e)
            }), 401
            
    except Exception as e:
        return jsonify({"valid": False, "error": str(e)}), 401

@auth_bp.route('/renew-token', methods=['POST'])
def renew_token():
    try:
        data = request.json
        email = data.get('email')
        
        if not email:
            return jsonify({"error": "Email is required"}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Generar un nuevo token
        token = generate_token(user)
        
        return jsonify({
            "token": token,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.username,
                "photoUrl": user.photoUrl,
                "photoData": user.photo_data,
                "role": user.role,
                "skills": user.skills,
                "interests": user.interests,
                "admin": user.admin
            }
        })
    except Exception as e:
        logger.error(f"Error renovando token: {str(e)}")
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/debug-token-keys', methods=['GET'])
def debug_token_keys():
    from ..utils.auth import JWT_SECRET_KEY
    
    # Obtener las claves (solo mostrar los primeros caracteres por seguridad)
    jwt_key = JWT_SECRET_KEY[:5] + '...' if JWT_SECRET_KEY else 'No definida'
    secret_key = os.environ.get('SECRET_KEY', 'No definida')
    secret_key_preview = secret_key[:5] + '...' if secret_key else 'No definida'
    
    return jsonify({
        "jwt_key_preview": jwt_key,
        "secret_key_preview": secret_key_preview,
        "keys_match": JWT_SECRET_KEY == secret_key
    })
