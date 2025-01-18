from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from config.config import Config
from dotenv import load_dotenv
import os

# Cargar variables de entorno desde .env
load_dotenv()

app = Flask(__name__)
app.config.from_object(Config)
db = SQLAlchemy(app)

# Importar modelos y rutas aquí

if __name__ == '__main__':
    app.run(debug=True)
