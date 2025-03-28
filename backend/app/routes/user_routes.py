from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models.user import User
from ..utils.auth import login_required, admin_required, get_current_user
import logging

logger = logging.getLogger(__name__)
user_bp = Blueprint('user_bp', __name__)

@user_bp.route('/users', methods=['GET'])
@login_required
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/users/<int:user_id>', methods=['GET'])
@login_required
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@user_bp.route('/users', methods=['POST'])
@login_required
def create_user():
    data = request.json
    new_user = User(
        username=data['username'],
        email=data['email'],
        role=data.get('role', 'mentee'),
        skills=data.get('skills', ''),
        interests=data.get('interests', '')
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify(new_user.to_dict()), 201

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
@login_required
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    user.username = data.get('username', user.username)
    user.email = data.get('email', user.email)
    user.role = data.get('role', user.role)
    user.skills = data.get('skills', user.skills)
    user.interests = data.get('interests', user.interests)
    db.session.commit()
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
@login_required
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return '', 204

@user_bp.route('/users/<int:user_id>/admin', methods=['PATCH'])
@login_required
@admin_required
def update_user_admin_status(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    if 'admin' in data:
        user.admin = data['admin']
        db.session.commit()
        return jsonify(user.to_dict())
    else:
        return jsonify({"error": "Admin status not provided"}), 400

@user_bp.route('/api/users/profile', methods=['PUT'])
@login_required
def update_profile():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Usuario no encontrado"}), 404
        
    data = request.json
    
    # Campos que se pueden actualizar
    if 'name' in data:
        current_user.username = data['name']
    if 'email' in data:
        current_user.email = data['email']
    if 'photoUrl' in data:
        current_user.photoUrl = data['photoUrl']
    if 'skills' in data:
        current_user.skills = data['skills']
    if 'interests' in data:
        current_user.interests = data['interests']
    if 'role' in data:
        current_user.role = data['role']
    if 'email_notifications' in data:
        current_user.email_notifications = data['email_notifications']
    if 'language' in data:
        current_user.language = data['language']
        
    db.session.commit()
    
    return jsonify(current_user.to_dict())

@user_bp.route('/api/users/language', methods=['POST'])
@login_required
def update_language():
    """Actualiza el idioma preferido del usuario para notificaciones"""
    current_user = get_current_user()
    if not current_user:
        return jsonify({"error": "Usuario no encontrado"}), 404
        
    data = request.json
    language = data.get('language')
    
    # Validar el idioma
    if not language or language not in ['en', 'es', 'fr']:
        return jsonify({"error": "Idioma no válido"}), 400
    
    # Actualizar el idioma
    current_user.language = language
    db.session.commit()
    
    logger.info(f"Usuario {current_user.username} ha actualizado su idioma a {language}")
    
    return jsonify({
        "success": True,
        "message": "Idioma actualizado correctamente",
        "language": language
    }) 