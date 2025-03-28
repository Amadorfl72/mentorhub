from app import create_app
from app import db
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def add_columns():
    try:
        # Crear la aplicación Flask y el contexto
        app = create_app()
        
        with app.app_context():
            # Añadir la columna email_notifications
            logger.info("Añadiendo columna 'email_notifications' a la tabla 'users'...")
            db.session.execute(db.text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NOT NULL DEFAULT TRUE"
            ))
            
            # Añadir la columna language
            logger.info("Añadiendo columna 'language' a la tabla 'users'...")
            db.session.execute(db.text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(5) NOT NULL DEFAULT 'en'"
            ))
            
            # Guardar los cambios
            db.session.commit()
            
            logger.info("Columnas añadidas correctamente")
            return True
            
    except Exception as e:
        logger.error(f"Error al añadir las columnas: {str(e)}")
        return False

if __name__ == "__main__":
    logger.info("Iniciando script para añadir columnas a la tabla users...")
    if add_columns():
        logger.info("Script completado correctamente.")
    else:
        logger.error("Error al ejecutar el script.") 