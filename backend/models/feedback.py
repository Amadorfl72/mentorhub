from backend.app import db

class Feedback(db.Model):
    __tablename__ = 'feedback'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('mentorship_sessions.id'), nullable=False)
    mentee_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=True)

    session = db.relationship('MentorshipSession', backref='feedback')
    mentee = db.relationship('User', backref='feedback')

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'mentee_id': self.mentee_id,
            'rating': self.rating,
            'comment': self.comment
        } 