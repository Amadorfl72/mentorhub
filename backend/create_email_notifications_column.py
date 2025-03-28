"""
Script para añadir la columna email_notifications a la tabla users.
Ejecutar desde la raíz del backend con: 
python create_email_notifications_column.py
"""

from sqlalchemy import create_engine, text
import os
import sys
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_database_url():
    """Obtener la URL de conexión a la base de datos desde las variables de entorno"""
    # Primero intentar obtener la URL completa
    db_uri = os.environ.get('DB_URI')
    if db_uri:
        logger.info(f"Usando DB_URI: {db_uri}")
        return db_uri
    
    # Si no hay DB_URI, construir la URL a partir de componentes individuales
    db_user = os.environ.get('DB_USER', 'postgres')
    db_password = os.environ.get('DB_PASSWORD', 'postgres')
    db_host = os.environ.get('DB_HOST', 'localhost')
    db_port = os.environ.get('DB_PORT', '5432')
    db_name = os.environ.get('DB_NAME', 'mentorhub')
    
    return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

def add_columns():
    """Añadir las columnas email_notifications y language a la tabla users si no existen"""
    try:
        # Crear conexión a la base de datos
        db_url = get_database_url()
        logger.info(f"Conectando a la base de datos: {db_url}")
        engine = create_engine(db_url)
        
        # Comprobar si la columna email_notifications ya existe
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT EXISTS (SELECT 1 FROM information_schema.columns "
                "WHERE table_name='users' AND column_name='email_notifications');"
            ))
            email_notifications_exists = result.scalar()
            
            result = conn.execute(text(
                "SELECT EXISTS (SELECT 1 FROM information_schema.columns "
                "WHERE table_name='users' AND column_name='language');"
            ))
            language_exists = result.scalar()
            
            # Añadir la columna email_notifications si no existe
            if not email_notifications_exists:
                logger.info("Añadiendo columna 'email_notifications' a la tabla 'users'...")
                conn.execute(text(
                    "ALTER TABLE users ADD COLUMN email_notifications BOOLEAN NOT NULL DEFAULT TRUE;"
                ))
                logger.info("Columna 'email_notifications' añadida correctamente.")
            else:
                logger.info("La columna 'email_notifications' ya existe en la tabla 'users'.")
            
            # Añadir la columna language si no existe
            if not language_exists:
                logger.info("Añadiendo columna 'language' a la tabla 'users'...")
                conn.execute(text(
                    "ALTER TABLE users ADD COLUMN language VARCHAR(5) NOT NULL DEFAULT 'en';"
                ))
                logger.info("Columna 'language' añadida correctamente.")
            else:
                logger.info("La columna 'language' ya existe en la tabla 'users'.")
                
        return True
    except Exception as e:
        logger.error(f"Error al añadir las columnas: {str(e)}")
        return False

if __name__ == "__main__":
    logger.info("Iniciando script para añadir columnas a la tabla users...")
    if add_columns():
        logger.info("Script completado correctamente.")
        sys.exit(0)
    else:
        logger.error("Error al ejecutar el script.")
        sys.exit(1) 