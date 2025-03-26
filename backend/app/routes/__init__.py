from .auth_routes import auth_bp
from .user_routes import user_bp
from .session_routes import session_bp
from .stats_routes import stats_bp
from .email_routes import email_bp

__all__ = ['auth_bp', 'user_bp', 'session_bp', 'stats_bp', 'email_bp']
