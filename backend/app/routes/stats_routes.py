from flask import Blueprint, jsonify
from ..utils.auth import login_required
from ..models.user import User
from ..models.session import MentorshipSession
from ..extensions import db

stats_bp = Blueprint('stats', __name__)

@stats_bp.route('/api/stats', methods=['GET'])
@login_required
def get_stats():
    try:
        # Obtener estadísticas básicas
        total_users = User.query.count()
        total_mentors = User.query.filter(User.role.in_(['mentor', 'both'])).count()
        total_mentees = User.query.filter(User.role.in_(['mentee', 'both'])).count()
        total_sessions = MentorshipSession.query.count()

        return jsonify({
            'total_users': total_users,
            'total_mentors': total_mentors,
            'total_mentees': total_mentees,
            'total_sessions': total_sessions
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500 