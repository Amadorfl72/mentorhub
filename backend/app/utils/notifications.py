from app.services.email_service import email_service
import os
import logging
from datetime import datetime, timedelta
import uuid
from icalendar import Calendar, Event
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import urllib.parse

# Configurar logger
logger = logging.getLogger(__name__)

def send_email(subject, recipients, body, html_body=None, scheduled_at=None, attachments=None):
    """
    Generic function to send emails.
    
    Args:
        subject: Subject of the email
        recipients: List of email recipients or a single recipient email
        body: Plain text content of the email
        html_body: HTML content of the email (preferred over plain text)
        scheduled_at: When to send the email (optional)
        attachments: List of dictionaries with attachment data (optional)
    
    Returns:
        Response from the Resend API
    """
    # Convert HTML plain text to HTML if no HTML body is provided
    final_html = html_body or f"<pre>{body}</pre>"
    
    # Get sender email from environment or use default
    sender = os.environ.get('MAIL_DEFAULT_SENDER', 'MentorHub <noreply@mentorhub.com>')
    
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
        scheduled_at=scheduled_at,
        attachments=attachments
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

def generate_google_calendar_link(session_data, mentor_name):
    """
    Generate a direct Google Calendar link for the session
    
    Args:
        session_data: Dictionary with session data (id, title, description, scheduled_time, max_attendees)
        mentor_name: Name of the mentor for the session
        
    Returns:
        Google Calendar URL string
    """
    try:
        # Parse scheduled time
        start_time = datetime.fromisoformat(session_data.scheduled_time.replace('Z', '+00:00'))
        # Default session duration: 1 hour
        end_time = start_time + timedelta(hours=1)
        
        # Format dates for Google Calendar - use standard format
        # Google Calendar requiere formato UTC (Z)
        start_formatted = start_time.strftime('%Y%m%dT%H%M%SZ')
        end_formatted = end_time.strftime('%Y%m%dT%H%M%SZ')
        
        # Crear URL con los parámetros estándar de Google Calendar
        # Nota: La URL completa debe ser exactamente como se especifica, sin cambios
        
        # Basic required properties
        title = urllib.parse.quote(session_data.title)
        details = urllib.parse.quote(f"Session with {mentor_name}\n\n{session_data.description}")
        location = urllib.parse.quote('MentorHub Virtual Session')
        dates = f"{start_formatted}/{end_formatted}"
        
        # Formato absolutamente correcto para Google Calendar
        google_url = f"https://calendar.google.com/calendar/event?action=TEMPLATE&text={title}&dates={dates}&details={details}&location={location}&trp=true"
        
        logger.info(f"Generated Google Calendar URL: {google_url}")
        return google_url
        
    except Exception as e:
        logger.error(f"Error al generar enlace de Google Calendar: {str(e)}")
        print(f"ERROR AL GENERAR ENLACE DE GOOGLE CALENDAR: {str(e)}")
        # En caso de error, devolver un enlace básico
        return "https://calendar.google.com/calendar/r/eventedit"

def generate_ical_event(session_data, mentor_name):
    """
    Generate an iCalendar (.ics) file from session data
    
    Args:
        session_data: Dictionary with session data (id, title, description, scheduled_time, max_attendees)
        mentor_name: Name of the mentor for the session
        
    Returns:
        String with ical content
    """
    try:
        # Create calendar
        cal = Calendar()
        cal.add('prodid', '-//MentorHub//mentorhub.com//')
        cal.add('version', '2.0')
        
        # Create event
        event = Event()
        
        # Generate unique ID for the event
        event_uid = f"mentorhub-session-{session_data.id}@mentorhub.com"
        event.add('uid', event_uid)
        
        # Add event details
        event.add('summary', session_data.title)
        
        # Add description
        description = f"Session with {mentor_name}\n\n{session_data.description}"
        event.add('description', description)
        
        # Parse scheduled time and set start/end
        start_time = datetime.fromisoformat(session_data.scheduled_time.replace('Z', '+00:00'))
        # Default session duration: 1 hour
        end_time = start_time + timedelta(hours=1)
        
        event.add('dtstart', start_time)
        event.add('dtend', end_time)
        
        # Add creation timestamp
        event.add('dtstamp', datetime.utcnow())
        
        # Add to calendar
        cal.add_component(event)
        
        # Convert to string
        return cal.to_ical().decode('utf-8')
        
    except Exception as e:
        logger.error(f"Error al generar archivo iCalendar: {str(e)}")
        print(f"ERROR AL GENERAR ICALENDAR: {str(e)}")
        return None 