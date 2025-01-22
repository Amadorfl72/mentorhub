import os
from datetime import timedelta

class Config:
    # Configuración básica
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    
    # Configuración de la base de datos
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/mentorhub')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Configuración de Google OAuth
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
    
    # Configuración JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    
    # Configuración CORS
    CORS_HEADERS = 'Content-Type' 