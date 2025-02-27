from ..extensions import db
from datetime import datetime

# Tabla intermedia para la relación muchos a muchos entre sesiones y mentees
session_mentees = db.Table('session_mentees',
    db.Column('session_id', db.Integer, db.ForeignKey('mentorship_sessions.id'), primary_key=True),
    db.Column('mentee_id', db.Integer, db.ForeignKey('users.id'), primary_key=True)
)

class MentorshipSession(db.Model):
    __tablename__ = 'mentorship_sessions'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    mentor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    scheduled_time = db.Column(db.DateTime, nullable=False)
    max_attendees = db.Column(db.Integer, nullable=False)
    keywords = db.Column(db.Text, nullable=True)  # Comma-separated keywords
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    mentor = db.relationship('User', foreign_keys=[mentor_id], backref='mentored_sessions')
    mentees = db.relationship('User', secondary=session_mentees, backref='sessions')

    def __repr__(self):
        return f'<MentorshipSession {self.title}>'
        
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'mentor_id': self.mentor_id,
            'scheduled_time': self.scheduled_time.isoformat() if self.scheduled_time else None,
            'max_attendees': self.max_attendees,
            'keywords': self.keywords,
            'created_at': self.created_at.isoformat() if hasattr(self, 'created_at') and self.created_at else None,
            'updated_at': self.updated_at.isoformat() if hasattr(self, 'updated_at') and self.updated_at else None,
            'mentees': [mentee.id for mentee in self.mentees] if self.mentees else []
        } 