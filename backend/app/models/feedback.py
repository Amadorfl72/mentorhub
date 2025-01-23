from ..extensions import db
from datetime import datetime

class Feedback(db.Model):
    __tablename__ = 'feedback'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('mentorship_sessions.id'), nullable=False)
    from_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    to_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relaciones
    session = db.relationship('MentorshipSession', backref='feedback')
    from_user = db.relationship('User', foreign_keys=[from_user_id], backref='feedback_given')
    to_user = db.relationship('User', foreign_keys=[to_user_id], backref='feedback_received')

    def __repr__(self):
        return f'<Feedback {self.id} from {self.from_user_id} to {self.to_user_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'from_user_id': self.from_user_id,
            'to_user_id': self.to_user_id,
            'rating': self.rating,
            'comment': self.comment
        } 