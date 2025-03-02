import requests
from datetime import datetime
import base64
import logging

logger = logging.getLogger(__name__)

def download_and_convert_image(url):
    """
    Descarga una imagen desde una URL y la convierte a base64
    """
    if not url:
        return None
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            logger.error(f"Error downloading image: {response.status_code}")
            return None
        
        # Obtener el tipo de contenido
        content_type = response.headers.get('Content-Type', 'image/jpeg')
        
        # Convertir a base64
        image_base64 = base64.b64encode(response.content).decode('utf-8')
        
        # Formato completo para usar en HTML/CSS
        return f"data:{content_type};base64,{image_base64}"
    
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return None
