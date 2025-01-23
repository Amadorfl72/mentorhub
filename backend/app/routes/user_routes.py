from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models.user import User
from ..utils.auth import login_required, admin_required
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
    try:
        data = request.json
        logger.debug(f"Received profile update data: {data}")

        # Obtener el usuario usando el ID del token
        current_user = User.query.get(request.user_id)
        if not current_user:
            return jsonify({"error": "User not found"}), 404

        # Actualizar campos
        if 'name' in data:
            current_user.username = data['name']
        if 'skills' in data:
            current_user.skills = data['skills']
        if 'interests' in data:
            current_user.interests = data['interests']
        if 'photoUrl' in data:
            current_user.photoUrl = data['photoUrl']
        if 'role' in data:
            current_user.role = data['role']

        db.session.commit()
        
        return jsonify({
            "message": "Profile updated successfully",
            "user": {
                "id": current_user.id,
                "email": current_user.email,
                "username": current_user.username,
                "name": current_user.username,
                "role": current_user.role,
                "photoUrl": current_user.photoUrl,
                "skills": current_user.skills,
                "interests": current_user.interests
            }
        })

    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500 