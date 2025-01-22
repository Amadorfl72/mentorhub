from extensions import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False, unique=True)
    email = db.Column(db.String(120), nullable=False, unique=True)
    google_id = db.Column(db.String(100), nullable=True, unique=True)  # ID de Google para SSO
    password_hash = db.Column(db.String(128), nullable=True)  # Opcional, para autenticación tradicional
    role = db.Column(db.String(20), nullable=False)  # 'mentor', 'mentee', or 'both'
    skills = db.Column(db.Text, nullable=True)  # Comma-separated keywords
    interests = db.Column(db.Text, nullable=True)  # Comma-separated keywords
    admin = db.Column(db.Boolean, default=False, nullable=False)  # Campo para privilegios de administrador

    def __repr__(self):
        return f'<User {self.username}>'
