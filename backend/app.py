from flask import Flask, redirect, url_for, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config.config import Config
from dotenv import load_dotenv
from flask_dance.contrib.google import make_google_blueprint, google
from flask_mail import Mail
from flask_cors import CORS
import os

# Cargar variables de entorno desde .env
load_dotenv()

app = Flask(__name__)
app.config.from_object(Config)

# Configuración CORS actualizada
CORS(app, 
    resources={r"/*": {
        "origins": [os.getenv('FRONTEND_URL', 'http://localhost:3000')],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }})

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', os.getenv('FRONTEND_URL', 'http://localhost:3000'))
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Configurar Flask-Dance para Google OAuth
google_bp = make_google_blueprint(
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    redirect_to="google_login"
)
app.register_blueprint(google_bp, url_prefix="/login")

# Configurar Flask-Mail
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.example.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'true').lower() in ['true', '1', 't']
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

# Obtener la lista de correos electrónicos de administradores desde el .env
admin_emails = os.getenv("ADMIN_EMAILS", "").split(",")

db = SQLAlchemy(app)
migrate = Migrate(app, db)  # Inicializar Flask-Migrate
mail = Mail(app)  # Inicializar Flask-Mail

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
    app.run(host='0.0.0.0', port=5000, debug=True)
