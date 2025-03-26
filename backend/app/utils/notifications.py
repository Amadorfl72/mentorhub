from app.services.email_service import email_service
import os
import logging

# Configurar logger
logger = logging.getLogger(__name__)

def send_email(subject, recipients, body, html_body=None, scheduled_at=None):
    """
    Generic function to send emails.
    
    Args:
        subject: Subject of the email
        recipients: List of email recipients or a single recipient email
        body: Plain text content of the email
        html_body: HTML content of the email (preferred over plain text)
        scheduled_at: When to send the email (optional)
    
    Returns:
        Response from the Resend API
    """
    # Convert HTML plain text to HTML if no HTML body is provided
    final_html = html_body or f"<pre>{body}</pre>"
    
    # Get sender email from environment or use default
    sender = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@mentorhub.com')
    
    # Log email details before sending
    recipients_str = recipients if isinstance(recipients, str) else ", ".join(recipients)
    log_message = f"ENVIANDO EMAIL | De: {sender} | Para: {recipients_str} | Asunto: {subject}"
    if scheduled_at:
        log_message += f" | Programado para: {scheduled_at}"
    
    print(log_message)  # Print para ver en consola
    logger.info(log_message)  # Log para el sistema de logging
    
    # Send email using our email service
    response = email_service.send_email(
        to=recipients,
        subject=subject,
        html_content=final_html,
        scheduled_at=scheduled_at
    )
    
    # Log success message
    print(f"EMAIL ENVIADO | ID: {response.get('id', 'unknown')}")
    logger.info(f"Email sent successfully with ID: {response.get('id', 'unknown')}")
    
    return response

def send_scheduled_email(subject, recipients, body, html_body=None, scheduled_at="in 1 hour"):
    """
    Send a scheduled email.
    
    Args:
        subject: Subject of the email
        recipients: List of email recipients or a single recipient email
        body: Plain text content of the email
        html_body: HTML content of the email (preferred over plain text)
        scheduled_at: When to send the email
    
    Returns:
        Response from the Resend API
    """
    return send_email(subject, recipients, body, html_body, scheduled_at) 