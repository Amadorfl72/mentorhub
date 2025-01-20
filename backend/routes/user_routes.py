from flask import Blueprint, request, jsonify
from backend.app import db
from backend.models.user import User
from backend.utils.auth import login_required, admin_required

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