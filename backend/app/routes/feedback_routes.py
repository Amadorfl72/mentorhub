from flask import Blueprint, request, jsonify
from backend.app import db
from backend.models.feedback import Feedback
from backend.utils.auth import login_required

feedback_bp = Blueprint('feedback_bp', __name__)

@feedback_bp.route('/feedback', methods=['POST'])
@login_required
def create_feedback():
    data = request.json
    new_feedback = Feedback(
        session_id=data['session_id'],
        mentee_id=request.user.id,
        rating=data['rating'],
        comment=data.get('comment', '')
    )
    db.session.add(new_feedback)
    db.session.commit()
    return jsonify(new_feedback.to_dict()), 201

@feedback_bp.route('/feedback/<int:session_id>', methods=['GET'])
@login_required
def get_feedback_for_session(session_id):
    feedbacks = Feedback.query.filter_by(session_id=session_id).all()
    return jsonify([feedback.to_dict() for feedback in feedbacks]) 