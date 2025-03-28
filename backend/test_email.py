#!/usr/bin/env python3
"""
Script para probar el envío de emails directamente con Resend.
Ejecutar desde la raíz del proyecto backend con:
python test_email.py
"""

import os
import sys
import resend
from dotenv import load_dotenv

def test_direct_resend():
    """Prueba el envío de email directamente con la API de Resend."""
    # Cargar variables de entorno
    load_dotenv()
    
    # Obtener API key
    api_key = os.environ.get('RESEND_API_KEY')
    if not api_key:
        print("ERROR: No se encontró RESEND_API_KEY en las variables de entorno")
        sys.exit(1)
    
    # Obtener remitente
    sender = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@mentorhub.com')
    
    # Configurar Resend
    print(f"Configurando Resend con API key: {api_key[:4]}...{api_key[-4:]}")
    resend.api_key = api_key
    
    # Destinatario de prueba (usar tu email)
    recipient = input("Ingresa el email de destinatario para la prueba: ")
    
    # Contenido del email
    subject = "Test Email desde MentorHub"
    html_content = """
    <h1>Prueba de Email</h1>
    <p>Este es un email de prueba enviado directamente desde la API de Resend.</p>
    <p>Si recibes este mensaje, significa que la configuración de Resend está funcionando correctamente.</p>
    """
    
    # Enviar email
    print(f"Enviando email de prueba a {recipient}...")
    try:
        response = resend.Emails.send({
            "from": sender,
            "to": [recipient],
            "subject": subject,
            "html": html_content
        })
        print(f"¡Email enviado exitosamente!")
        print(f"Respuesta: {response}")
        return True
    except Exception as e:
        print(f"ERROR al enviar email: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return False

if __name__ == "__main__":
    print("=== PRUEBA DE ENVÍO DE EMAIL DIRECTAMENTE CON RESEND ===")
    success = test_direct_resend()
    if success:
        print("\n✅ El envío de email fue exitoso. Verifica tu bandeja de entrada.")
    else:
        print("\n❌ Error al enviar el email. Verifica las credenciales y la configuración.") 