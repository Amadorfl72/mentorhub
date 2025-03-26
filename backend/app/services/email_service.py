import os
import resend
from typing import List, Union, Optional
from datetime import datetime
from flask import current_app
import logging
import traceback

# Configurar logger con nivel DEBUG
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Asegurar que hay un handler para la consola
if not logger.handlers:
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

class EmailService:
    """
    Email service class that provides methods to send emails using Resend.
    """
    
    def __init__(self):
        """Initialize the EmailService with API key from environment."""
        self.api_key = os.environ.get('RESEND_API_KEY')
        self.from_email = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@mentorhub.com')
        
        # Verificar y configurar la API key
        if not self.api_key:
            logger.error("¡ERROR CRÍTICO! RESEND_API_KEY no está configurada en las variables de entorno")
            print("¡ERROR CRÍTICO! RESEND_API_KEY no está configurada en las variables de entorno")
        else:
            logger.info(f"Configurando Resend con API key: {self.api_key[:4]}...{self.api_key[-4:]}")
            print(f"Configurando Resend con API key: {self.api_key[:4]}...{self.api_key[-4:]}")
            resend.api_key = self.api_key
    
    def send_email(self, 
                  to: Union[str, List[str]], 
                  subject: str, 
                  html_content: str,
                  from_email: Optional[str] = None,
                  cc: Optional[Union[str, List[str]]] = None,
                  bcc: Optional[Union[str, List[str]]] = None,
                  scheduled_at: Optional[str] = None) -> dict:
        """
        Send an email to one or more recipients.
        
        Args:
            to: Email address(es) of the recipient(s)
            subject: Email subject
            html_content: HTML content of the email
            from_email: Sender email (defaults to MAIL_DEFAULT_SENDER)
            cc: Email address(es) for CC
            bcc: Email address(es) for BCC
            scheduled_at: When to send the email. Can be ISO 8601 date string or natural language
                         like "in 1 hour", "tomorrow at 9am", or "Friday at 3pm ET".
                         Emails can be scheduled up to 72 hours in advance.
            
        Returns:
            The response from the Resend API
        """
        try:
            # Log API key state
            logger.debug(f"Estado API Key: {'Configurada' if resend.api_key else 'NO CONFIGURADA'}")
            print(f"Estado API Key: {'Configurada' if resend.api_key else 'NO CONFIGURADA'}")
            
            # Prepare the email payload
            payload = {
                "from": from_email or self.from_email,
                "subject": subject,
                "html": html_content,
            }
            
            # Handle to field (can be string or list)
            if isinstance(to, list):
                payload["to"] = to
            else:
                payload["to"] = [to]
                
            # Add CC if provided
            if cc:
                if isinstance(cc, list):
                    payload["cc"] = cc
                else:
                    payload["cc"] = [cc]
                    
            # Add BCC if provided
            if bcc:
                if isinstance(bcc, list):
                    payload["bcc"] = bcc
                else:
                    payload["bcc"] = [bcc]
                    
            # Add scheduling if provided
            if scheduled_at:
                payload["scheduled_at"] = scheduled_at
            
            # Log the payload (sin HTML para legibilidad)
            payload_log = {k: v for k, v in payload.items() if k != 'html'}
            payload_log['html'] = f"{len(html_content)} characters of HTML"
            logger.debug(f"Enviando email con payload: {payload_log}")
            print(f"Enviando email con payload: {payload_log}")
            
            # Send the email
            try:
                logger.debug("Llamando a Resend.Emails.send()")
                print("Llamando a Resend.Emails.send()")
                response = resend.Emails.send(payload)
                logger.debug(f"Respuesta de Resend: {response}")
                print(f"Respuesta de Resend: {response}")
            except Exception as send_error:
                logger.error(f"Error en la llamada a Resend API: {str(send_error)}")
                print(f"Error en la llamada a Resend API: {str(send_error)}")
                logger.error(traceback.format_exc())
                print(traceback.format_exc())
                raise send_error
            
            log_message = f"Email{'scheduled' if scheduled_at else 'sent'} to {to} with subject: {subject}"
            if scheduled_at:
                log_message += f" (scheduled for: {scheduled_at})"
                
            logger.info(log_message)
            if hasattr(current_app, 'logger'):
                current_app.logger.info(log_message)
            
            return response
            
        except Exception as e:
            error_msg = f"Failed to send email: {str(e)}"
            logger.error(error_msg)
            logger.error(traceback.format_exc())
            print(error_msg)
            print(traceback.format_exc())
            
            if hasattr(current_app, 'logger'):
                current_app.logger.error(error_msg)
            
            raise e
    
    def send_template_email(self, 
                           to: Union[str, List[str]], 
                           subject: str,
                           template_id: str,
                           template_data: dict,
                           from_email: Optional[str] = None,
                           cc: Optional[Union[str, List[str]]] = None,
                           bcc: Optional[Union[str, List[str]]] = None,
                           scheduled_at: Optional[str] = None) -> dict:
        """
        Send an email using a Resend template.
        
        Args:
            to: Email address(es) of the recipient(s)
            subject: Email subject
            template_id: ID of the Resend template
            template_data: Data to populate the template
            from_email: Sender email (defaults to MAIL_DEFAULT_SENDER)
            cc: Email address(es) for CC
            bcc: Email address(es) for BCC
            scheduled_at: When to send the email. Can be ISO 8601 date string or natural language
                         like "in 1 hour", "tomorrow at 9am", or "Friday at 3pm ET".
                         Emails can be scheduled up to 72 hours in advance.
            
        Returns:
            The response from the Resend API
        """
        try:
            # Prepare the email payload
            payload = {
                "from": from_email or self.from_email,
                "subject": subject,
                "template": template_id,
                "data": template_data,
            }
            
            # Handle to field (can be string or list)
            if isinstance(to, list):
                payload["to"] = to
            else:
                payload["to"] = [to]
                
            # Add CC if provided
            if cc:
                if isinstance(cc, list):
                    payload["cc"] = cc
                else:
                    payload["cc"] = [cc]
                    
            # Add BCC if provided
            if bcc:
                if isinstance(bcc, list):
                    payload["bcc"] = bcc
                else:
                    payload["bcc"] = [bcc]
                    
            # Add scheduling if provided
            if scheduled_at:
                payload["scheduled_at"] = scheduled_at
            
            # Send the email
            response = resend.Emails.send(payload)
            
            log_message = f"Template email{'scheduled' if scheduled_at else 'sent'} to {to} with subject: {subject}"
            if scheduled_at:
                log_message += f" (scheduled for: {scheduled_at})"
                
            current_app.logger.info(log_message)
            return response
            
        except Exception as e:
            current_app.logger.error(f"Failed to send template email: {str(e)}")
            raise e
            
    def reschedule_email(self, email_id: str, scheduled_at: str) -> dict:
        """
        Reschedule an already scheduled email.
        
        Args:
            email_id: The ID of the email to reschedule
            scheduled_at: The new scheduled time (ISO 8601 or natural language)
            
        Returns:
            The response from the Resend API
        """
        try:
            payload = {
                "id": email_id,
                "scheduled_at": scheduled_at
            }
            
            response = resend.Emails.update(payload)
            
            current_app.logger.info(f"Email {email_id} rescheduled for: {scheduled_at}")
            return response
            
        except Exception as e:
            current_app.logger.error(f"Failed to reschedule email: {str(e)}")
            raise e
            
    def cancel_scheduled_email(self, email_id: str) -> dict:
        """
        Cancel a scheduled email.
        
        Args:
            email_id: The ID of the email to cancel
            
        Returns:
            The response from the Resend API
        """
        try:
            response = resend.Emails.cancel(email_id)
            
            current_app.logger.info(f"Scheduled email {email_id} canceled")
            return response
            
        except Exception as e:
            current_app.logger.error(f"Failed to cancel scheduled email: {str(e)}")
            raise e

# Create a singleton instance
email_service = EmailService()
