from flask import Blueprint, request, jsonify
from backend.app import db
from backend.models.session import MentorshipSession, session_mentees
from backend.models.user import User
from backend.utils.auth import login_required

session_bp = Blueprint('session_bp', __name__)

@session_bp.route('/sessions', methods=['GET'])
@login_required
def get_sessions():
    sessions = MentorshipSession.query.all()
    return jsonify([session.to_dict() for session in sessions])

@session_bp.route('/sessions/<int:session_id>', methods=['GET'])
@login_required
def get_session(session_id):
    session = MentorshipSession.query.get_or_404(session_id)
    return jsonify(session.to_dict())

@session_bp.route('/sessions', methods=['POST'])
@login_required
def create_session():
    data = request.json
    new_session = MentorshipSession(
        title=data['title'],
        description=data['description'],
        mentor_id=data['mentor_id'],
        scheduled_time=data['scheduled_time'],
        max_attendees=data['max_attendees'],
        keywords=data.get('keywords', '')
    )
    db.session.add(new_session)
    db.session.commit()
    return jsonify(new_session.to_dict()), 201

@session_bp.route('/sessions/<int:session_id>', methods=['PUT'])
@login_required
def update_session(session_id):
    session = MentorshipSession.query.get_or_404(session_id)
    data = request.json
    session.title = data.get('title', session.title)
    session.description = data.get('description', session.description)
    session.scheduled_time = data.get('scheduled_time', session.scheduled_time)
    session.max_attendees = data.get('max_attendees', session.max_attendees)
    session.keywords = data.get('keywords', session.keywords)
    db.session.commit()
    return jsonify(session.to_dict())

@session_bp.route('/sessions/<int:session_id>', methods=['DELETE'])
@login_required
def delete_session(session_id):
    session = MentorshipSession.query.get_or_404(session_id)
    db.session.delete(session)
    db.session.commit()
    return '', 204

@session_bp.route('/sessions/<int:session_id>/enrol', methods=['POST'])
@login_required
def enrol_mentee(session_id):
    session = MentorshipSession.query.get_or_404(session_id)
    data = request.json
    mentee_id = data.get('mentee_id')

    if not mentee_id:
        return jsonify({"error": "Mentee ID is required"}), 400

    mentee = User.query.get_or_404(mentee_id)

    # Verificar si el mentee ya está inscrito
    if mentee in session.mentees:
        return jsonify({"error": "Mentee is already enrolled in this session"}), 400

    # Verificar si hay espacio disponible
    if len(session.mentees) >= session.max_attendees:
        return jsonify({"error": "Session is full"}), 400

    # Añadir el mentee a la sesión
    session.mentees.append(mentee)
    db.session.commit()

    return jsonify({"message": f"Mentee {mentee.username} enrolled in session {session.title}"}), 200
