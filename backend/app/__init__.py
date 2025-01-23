import os
import sys
from flask import Flask
from flask_cors import CORS
from flask_dance.contrib.google import make_google_blueprint
from .extensions import db, migrate, mail
from .routes import auth_bp, user_bp, session_bp, stats_bp
from config import Config
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    CORS(app, 
         resources={
             r"/*": {
                 "origins": ["http://localhost:3000"],
                 "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                 "allow_headers": ["Content-Type", "Authorization"],
                 "supports_credentials": True,
                 "expose_headers": ["Content-Type", "Authorization"]
             }
         })
    
    db.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(session_bp)
    app.register_blueprint(stats_bp)

    return app

app = create_app()

@app.route("/")
def index():
    if not google.authorized:
        return redirect(url_for("google.login"))
    resp = google.get("/plus/v1/people/me")
    assert resp.ok, resp.text
    return f"You are {resp.json()['displayName']} on Google"

@app.route("/google_login")
def google_login():
    if not google.authorized:
        return redirect(url_for("google.login"))
    
    resp = google.get("/plus/v1/people/me")
    assert resp.ok, resp.text
    user_info = resp.json()
    email = user_info['emails'][0]['value']

    # Verificar si el usuario ya existe en la base de datos
    user = User.query.filter_by(email=email).first()

    if not user:
        # Crear un nuevo usuario si no existe
        user = User(
            username=user_info['displayName'],
            email=email,
            google_id=user_info['id'],
            role='both',  # Asignar un rol por defecto
            admin=email in admin_emails  # Asignar admin si el email coincide
        )
        db.session.add(user)
        db.session.commit()
    else:
        # Actualizar el campo admin si el usuario ya existe
        user.admin = email in admin_emails
        db.session.commit()

    return f"Logged in as {user.username} with admin status: {user.admin}"

@app.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
    
    return jsonify({"success": True}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
