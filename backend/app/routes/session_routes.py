from flask import Blueprint, request, jsonify, current_app
from ..extensions import db
from ..models.session import MentorshipSession, session_mentees
from ..models.user import User
from ..utils.auth import login_required, get_current_user
from ..utils.notifications import send_email, generate_ical_event, generate_google_calendar_link
import os
import logging

# Configurar logger
logger = logging.getLogger(__name__)

session_bp = Blueprint('session', __name__)

@session_bp.route('/sessions', methods=['GET'])
@login_required
def get_sessions():
    # Obtener parámetros de consulta
    mentor_id = request.args.get('mentor_id', type=int)
    mentee_id = request.args.get('mentee_id', type=int)
    
    # Construir la consulta base
    query = MentorshipSession.query
    
    # Aplicar filtros si se proporcionan
    if mentor_id:
        query = query.filter(MentorshipSession.mentor_id == mentor_id)
    
    if mentee_id:
        # Filtrar por mentee_id usando la relación
        query = query.join(session_mentees).filter(session_mentees.c.mentee_id == mentee_id)
    
    # Ejecutar la consulta
    print(query)
    sessions = query.all()
    return jsonify([session.to_dict() for session in sessions])

@session_bp.route('/sessions/<int:session_id>', methods=['GET'])
@login_required
def get_session(session_id):
    session = MentorshipSession.query.get_or_404(session_id)
    return jsonify(session.to_dict())

@session_bp.route('/sessions', methods=['POST'])
@login_required
def create_session():
    data = request.json
    
    # Parámetro que indica si se debe enviar notificación (por defecto True)
    send_notification = data.get('send_notification', True)
    
    # Eliminar el parámetro send_notification del objeto de datos si existe
    if 'send_notification' in data:
        del data['send_notification']
    
    new_session = MentorshipSession(
        title=data['title'],
        description=data['description'],
        mentor_id=data['mentor_id'],
        scheduled_time=data['scheduled_time'],
        max_attendees=data['max_attendees'],
        keywords=data.get('keywords', '')
    )
    db.session.add(new_session)
    db.session.commit()
    
    # Enviar email a todos los usuarios excepto al creador solo si send_notification es True
    if send_notification:
        _send_session_notifications(new_session)
    else:
        logger.info(f"Notificaciones desactivadas para la sesión: {new_session.title}")
        print(f"Notificaciones desactivadas para la sesión: {new_session.title}")
    
    return jsonify(new_session.to_dict()), 201

@session_bp.route('/sessions/<int:session_id>/send-notifications', methods=['POST'])
@login_required
def send_session_notifications(session_id):
    """Endpoint para enviar notificaciones de una sesión específica"""
    current_user = get_current_user()
    session = MentorshipSession.query.get_or_404(session_id)
    
    # Verificar si el usuario tiene permisos para enviar notificaciones (debe ser el creador)
    if session.mentor_id != current_user.id:
        return jsonify({"error": "No tienes permiso para enviar notificaciones de esta sesión"}), 403
    
    try:
        # Enviar notificaciones
        _send_session_notifications(session)
        return jsonify({"message": "Notificaciones enviadas correctamente"}), 200
    except Exception as e:
        logger.error(f"Error al enviar notificaciones para la sesión {session_id}: {str(e)}")
        return jsonify({"error": f"Error al enviar notificaciones: {str(e)}"}), 500

def _send_session_notifications(session):
    """Función auxiliar para enviar notificaciones de una sesión"""
    try:
        logger.info(f"Preparando envío de notificaciones para sesión: {session.title}")
        print(f"Preparando envío de notificaciones para sesión: {session.title}")
        
        # Obtener todos los usuarios
        all_users = User.query.all()
        
        # Obtener el creador
        creator = User.query.get(session.mentor_id)
        
        # Filtrar usuarios que no son el creador
        recipients = [user.email for user in all_users if user.id != creator.id]
        
        logger.info(f"Se enviarán notificaciones a {len(recipients)} usuarios")
        print(f"Se enviarán notificaciones a {len(recipients)} usuarios")
        
        if recipients:
            # URL del frontend para la sesión
            frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
            session_url = f"{frontend_url}/session/{session.id}"
            
            # Preparar el HTML del email
            html_content = f"""
            <h1>New Session In MentorHub!</h1>
            <p>Dear team,</p>
            <p>A new session has been created in MentorHub. Check the details and enrol a.s.a.p if you're interested. There are limited seats!!</p>
            <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                <h2>{session.title}</h2>
                <p><strong>Description:</strong> {session.description}</p>
                <p><strong>Created by:</strong> {creator.username}</p>
                <p><strong>Date:</strong> {session.scheduled_time}</p>
                <p><strong>Max attendees:</strong> {session.max_attendees}</p>
            </div>
            <p><a href="{session_url}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Bring me to MentorHub</a></p>
            """
            
            # Enviar el email
            response = send_email(
                subject="New Session In MentorHub!",
                recipients=recipients,
                body="A new session has been created in MentorHub.",
                html_body=html_content
            )
            
            logger.info(f"Notificación de sesión enviada con ID: {response.get('id', 'unknown')}")
            print(f"Notificación de sesión enviada con ID: {response.get('id', 'unknown')}")
            return True
    except Exception as e:
        logger.error(f"Error al enviar notificaciones de sesión: {str(e)}")
        print(f"ERROR AL ENVIAR NOTIFICACIONES: {str(e)}")
        raise e

@session_bp.route('/sessions/<int:session_id>', methods=['PUT'])
@login_required
def update_session(session_id):
    session = MentorshipSession.query.get_or_404(session_id)
    
    # Guardar valores originales para comparar cambios
    original_title = session.title
    original_description = session.description
    original_scheduled_time = session.scheduled_time
    original_max_attendees = session.max_attendees
    
    # Actualizar la sesión con los nuevos datos
    data = request.json
    session.title = data.get('title', session.title)
    session.description = data.get('description', session.description)
    session.scheduled_time = data.get('scheduled_time', session.scheduled_time)
    session.max_attendees = data.get('max_attendees', session.max_attendees)
    session.keywords = data.get('keywords', session.keywords)
    
    # Guardar los cambios
    db.session.commit()
    
    # Verificar si hubo cambios importantes
    important_changes = {}
    if original_title != session.title:
        important_changes['title'] = {'old': original_title, 'new': session.title}
    if original_description != session.description:
        important_changes['description'] = {'old': original_description, 'new': session.description}
    if original_scheduled_time != session.scheduled_time:
        important_changes['scheduled_time'] = {'old': original_scheduled_time, 'new': session.scheduled_time}
    if original_max_attendees != session.max_attendees:
        important_changes['max_attendees'] = {'old': original_max_attendees, 'new': session.max_attendees}
    
    # Enviar notificaciones solo si hay cambios importantes
    if important_changes and session.mentees:
        try:
            # Obtener información del mentor
            mentor = User.query.get(session.mentor_id)
            mentor_name = mentor.username if mentor else "Unknown"
            
            # URL del frontend
            frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
            session_url = f"{frontend_url}/session/{session.id}"
            
            # Enviar email a cada mentee inscrito
            for user in session.mentees:
                # Determinar el idioma del usuario (usar inglés por defecto)
                user_lang = user.language if hasattr(user, 'language') and user.language in ['en', 'es', 'fr'] else 'en'
                
                # Configurar el contenido según el idioma
                if user_lang == 'es':
                    subject = f"ACTUALIZACIÓN: {session.title}"
                    title = "Actualización de Sesión"
                    greeting = f"Estimado/a {user.username},"
                    notification = "Una sesión en la que estás inscrito/a ha sido actualizada:"
                    change_notice = "Se han realizado los siguientes cambios:"
                    title_label = "Título"
                    description_label = "Descripción"
                    date_label = "Fecha programada"
                    attendees_label = "Máximo de asistentes"
                    old_value = "Valor anterior"
                    new_value = "Nuevo valor"
                    session_details = "Detalles actualizados de la sesión"
                    view_button = "Ver Detalles de la Sesión"
                    footer = "¡Esperamos contar con tu participación!"
                    regards = "Saludos cordiales,"
                    team = "El Equipo de MentorHub"
                elif user_lang == 'fr':
                    subject = f"MISE À JOUR: {session.title}"
                    title = "Mise à Jour de Session"
                    greeting = f"Cher/Chère {user.username},"
                    notification = "Une session à laquelle vous êtes inscrit a été mise à jour:"
                    change_notice = "Les modifications suivantes ont été apportées:"
                    title_label = "Titre"
                    description_label = "Description"
                    date_label = "Date prévue"
                    attendees_label = "Maximum de participants"
                    old_value = "Ancienne valeur"
                    new_value = "Nouvelle valeur"
                    session_details = "Détails mis à jour de la session"
                    view_button = "Voir les Détails de la Session"
                    footer = "Nous espérons vous voir à cette session!"
                    regards = "Cordialement,"
                    team = "L'équipe MentorHub"
                else:  # 'en' por defecto
                    subject = f"UPDATE: {session.title}"
                    title = "Session Update"
                    greeting = f"Dear {user.username},"
                    notification = "A session you are enrolled in has been updated:"
                    change_notice = "The following changes have been made:"
                    title_label = "Title"
                    description_label = "Description"
                    date_label = "Scheduled date"
                    attendees_label = "Maximum attendees"
                    old_value = "Previous value"
                    new_value = "New value"
                    session_details = "Updated session details"
                    view_button = "View Session Details"
                    footer = "We look forward to your participation!"
                    regards = "Best regards,"
                    team = "The MentorHub Team"
                
                # Construir la tabla de cambios HTML
                changes_html = f"<h2>{change_notice}</h2><table border='1' cellpadding='10' style='border-collapse: collapse; width: 100%;'>"
                
                # Añadir encabezados de la tabla
                changes_html += f"<tr style='background-color: #f2f2f2;'><th>Campo</th><th>{old_value}</th><th>{new_value}</th></tr>"
                
                # Añadir filas para cada cambio
                if 'title' in important_changes:
                    changes_html += f"<tr><td>{title_label}</td><td>{important_changes['title']['old']}</td><td>{important_changes['title']['new']}</td></tr>"
                if 'description' in important_changes:
                    changes_html += f"<tr><td>{description_label}</td><td>{important_changes['description']['old']}</td><td>{important_changes['description']['new']}</td></tr>"
                if 'scheduled_time' in important_changes:
                    changes_html += f"<tr><td>{date_label}</td><td>{important_changes['scheduled_time']['old']}</td><td>{important_changes['scheduled_time']['new']}</td></tr>"
                if 'max_attendees' in important_changes:
                    changes_html += f"<tr><td>{attendees_label}</td><td>{important_changes['max_attendees']['old']}</td><td>{important_changes['max_attendees']['new']}</td></tr>"
                
                changes_html += "</table>"
                
                # Preparar el HTML del email
                html_content = f"""
                <h1>{title}</h1>
                <p>{greeting}</p>
                <p>{notification}</p>
                <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
                    <h2 style="color: #1976d2;">{session.title}</h2>
                    {changes_html}
                    <h3 style="margin-top: 20px;">{session_details}</h3>
                    <p><strong>{title_label}:</strong> {session.title}</p>
                    <p><strong>{description_label}:</strong> {session.description}</p>
                    <p><strong>{date_label}:</strong> {session.scheduled_time}</p>
                    <p><strong>Mentor:</strong> {mentor_name}</p>
                    <p><strong>{attendees_label}:</strong> {session.max_attendees}</p>
                </div>
                <p>
                    <a href="{session_url}" style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px;">
                        {view_button}
                    </a>
                </p>
                <p>{footer}</p>
                <p>{regards}<br>{team}</p>
                """
                
                # Enviar el email
                response = send_email(
                    subject=subject,
                    recipients=[user.email],
                    body=f"{notification} {session.title}",
                    html_body=html_content
                )
                
                logger.info(f"Email de actualización enviado a {user.email} con ID: {response.get('id', 'unknown')}")
        except Exception as e:
            # Solo registrar el error, no interrumpir el flujo
            logger.error(f"Error al enviar emails de actualización: {str(e)}")
            print(f"ERROR AL ENVIAR EMAILS DE ACTUALIZACIÓN: {str(e)}")
    
    return jsonify(session.to_dict())

@session_bp.route('/sessions/<int:session_id>', methods=['DELETE'])
@login_required
def delete_session(session_id):
    session = MentorshipSession.query.get_or_404(session_id)
    
    # Guardar datos relevantes antes de eliminar la sesión
    session_title = session.title
    session_description = session.description
    session_scheduled_time = session.scheduled_time
    
    # Obtener información del mentor
    mentor = User.query.get(session.mentor_id)
    mentor_name = mentor.username if mentor else "Unknown"
    
    # Obtener todos los usuarios inscritos en la sesión
    enrolled_users = session.mentees
    
    # Enviar notificaciones de cancelación a los usuarios inscritos
    if enrolled_users:
        try:
            # URL del frontend
            frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
            
            # Enviar email a cada usuario inscrito
            for user in enrolled_users:
                # Determinar el idioma del usuario (usar inglés por defecto)
                user_lang = user.language if hasattr(user, 'language') and user.language in ['en', 'es', 'fr'] else 'en'
                
                # Preparar el HTML del email según el idioma del usuario
                if user_lang == 'es':
                    subject = f"CANCELADO: {session_title}"
                    title = "Aviso de Cancelación de Sesión"
                    greeting = f"Estimado/a {user.username},"
                    notification = "Lamentamos informarte que la siguiente sesión ha sido cancelada:"
                    session_title_label = "Título"
                    description_label = "Descripción"
                    mentor_label = "Mentor"
                    date_label = "Fecha programada"
                    apology = "Nos disculpamos por cualquier inconveniente que esto pueda causar."
                    alternative = "Por favor, consulta nuestra plataforma para sesiones alternativas que puedan interesarte."
                    button = "Explorar Sesiones"
                    regards = "Saludos cordiales,"
                    team = "El Equipo de MentorHub"
                elif user_lang == 'fr':
                    subject = f"ANNULÉ: {session_title}"
                    title = "Avis d'Annulation de Session"
                    greeting = f"Cher/Chère {user.username},"
                    notification = "Nous regrettons de vous informer que la session suivante a été annulée:"
                    session_title_label = "Titre"
                    description_label = "Description"
                    mentor_label = "Mentor"
                    date_label = "Date prévue"
                    apology = "Nous nous excusons pour tout inconvénient que cela pourrait causer."
                    alternative = "Veuillez consulter notre plateforme pour des sessions alternatives qui pourraient vous intéresser."
                    button = "Parcourir les Sessions"
                    regards = "Cordialement,"
                    team = "L'équipe MentorHub"
                else: # 'en' by default
                    subject = f"CANCELLED: {session_title}"
                    title = "Session Cancellation Notice"
                    greeting = f"Dear {user.username},"
                    notification = "We regret to inform you that the following session has been cancelled:"
                    session_title_label = "Title"
                    description_label = "Description"
                    mentor_label = "Mentor"
                    date_label = "Scheduled date"
                    apology = "We apologize for any inconvenience this may cause."
                    alternative = "Please check our platform for alternative sessions that might interest you."
                    button = "Browse Sessions"
                    regards = "Best regards,"
                    team = "The MentorHub Team"
                
                # Preparar el HTML del email
                html_content = f"""
                <h1>{title}</h1>
                <p>{greeting}</p>
                <p>{notification}</p>
                <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
                    <h2 style="color: #e53935;">{session_title}</h2>
                    <p><strong>{session_title_label}:</strong> {session_title}</p>
                    <p><strong>{description_label}:</strong> {session_description}</p>
                    <p><strong>{mentor_label}:</strong> {mentor_name}</p>
                    <p><strong>{date_label}:</strong> {session_scheduled_time}</p>
                </div>
                <p>{apology}</p>
                <p>{alternative}</p>
                <p>
                    <a href="{frontend_url}/sessions" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
                        {button}
                    </a>
                </p>
                <p>{regards}<br>{team}</p>
                """
                
                # Enviar el email
                response = send_email(
                    subject=subject,
                    recipients=[user.email],
                    body=f"{notification} {session_title}",
                    html_body=html_content
                )
                
                logger.info(f"Email de cancelación enviado a {user.email} con ID: {response.get('id', 'unknown')}")
        except Exception as e:
            # Solo registrar el error, no interrumpir el flujo
            logger.error(f"Error al enviar emails de cancelación: {str(e)}")
            print(f"ERROR AL ENVIAR EMAILS DE CANCELACIÓN: {str(e)}")
    
    # Eliminar la sesión
    db.session.delete(session)
    db.session.commit()
    return '', 204

@session_bp.route('/sessions/<int:session_id>/enrol', methods=['POST'])
@login_required
def enrol_mentee(session_id):
    session = MentorshipSession.query.get_or_404(session_id)
    data = request.json
    mentee_id = data.get('mentee_id')

    if not mentee_id:
        return jsonify({"error": "Mentee ID is required"}), 400

    mentee = User.query.get_or_404(mentee_id)

    # Verificar si el mentee ya está inscrito
    if mentee in session.mentees:
        return jsonify({"error": "Mentee is already enrolled in this session"}), 400

    # Verificar si hay espacio disponible
    if len(session.mentees) >= session.max_attendees:
        return jsonify({"error": "Session is full"}), 400

    # Añadir el mentee a la sesión
    session.mentees.append(mentee)
    db.session.commit()
    
    # Enviar email de confirmación
    try:
        # Obtener información del mentor
        mentor = User.query.get(session.mentor_id)
        mentor_name = mentor.username if mentor else "Unknown"
        
        # URL del frontend para la sesión
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
        session_url = f"{frontend_url}/session/{session.id}"
        
        # Preparar el HTML del email
        html_content = f"""
        <h1>Session Enrollment Confirmation</h1>
        <p>Dear {mentee.username},</p>
        <p>You have successfully enrolled in the following session:</p>
        <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
            <h2>{session.title}</h2>
            <p><strong>Description:</strong> {session.description}</p>
            <p><strong>Mentor:</strong> {mentor_name}</p>
            <p><strong>Date:</strong> {session.scheduled_time}</p>
            <p><strong>Max attendees:</strong> {session.max_attendees}</p>
        </div>
        <p>
            <a href="{session_url}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-right: 10px;">View Session Details</a>
        </p>
        <p>We look forward to your participation!</p>
        <p>Best regards,<br>The MentorHub Team</p>
        """
        
        # Enviar el email
        response = send_email(
            subject=f"Enrollment Confirmation: {session.title}",
            recipients=[mentee.email],
            body=f"You have successfully enrolled in the session: {session.title}",
            html_body=html_content
        )
        
        logger.info(f"Email de confirmación enviado con ID: {response.get('id', 'unknown')}")
    except Exception as e:
        # Solo registrar el error, no interrumpir el flujo
        logger.error(f"Error al enviar email de confirmación: {str(e)}")
        print(f"ERROR AL ENVIAR EMAIL DE CONFIRMACIÓN: {str(e)}")

    return jsonify({"message": f"Mentee {mentee.username} enrolled in session {session.title}"}), 200

@session_bp.route('/sessions/<int:session_id>/unenrol', methods=['POST'])
@login_required
def unenrol_mentee(session_id):
    session = MentorshipSession.query.get_or_404(session_id)
    data = request.json
    mentee_id = data.get('mentee_id')

    if not mentee_id:
        return jsonify({"error": "Mentee ID is required"}), 400

    mentee = User.query.get_or_404(mentee_id)

    # Verificar si el mentee está inscrito
    if mentee not in session.mentees:
        return jsonify({"error": "Mentee is not enrolled in this session"}), 400

    # Eliminar el mentee de la sesión
    session.mentees.remove(mentee)
    db.session.commit()

    return jsonify({"message": f"Mentee {mentee.username} unenrolled from session {session.title}"}), 200
