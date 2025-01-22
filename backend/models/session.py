from extensions import db

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

    mentor = db.relationship('User', foreign_keys=[mentor_id], backref='mentored_sessions')
    mentees = db.relationship('User', secondary=session_mentees, backref='sessions')

    def __repr__(self):
        return f'<MentorshipSession {self.title}>' 