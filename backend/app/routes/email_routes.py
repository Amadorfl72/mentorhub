from flask import Blueprint, request, jsonify
from app.services.email_service import email_service
from app.utils.auth import admin_required, login_required
import json

email_bp = Blueprint('email_bp', __name__)

@email_bp.route('/api/emails/send', methods=['POST'])
@login_required
def send_email():
    """
    Send an email using the email service.
    Required JSON fields: to, subject, html_content
    Optional JSON fields: cc, bcc, scheduled_at
    """
    try:
        data = request.get_json()
        
        # Required fields
        required_fields = ['to', 'subject', 'html_content']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
                
        # Optional fields with defaults
        from_email = data.get('from_email')
        cc = data.get('cc')
        bcc = data.get('bcc')
        scheduled_at = data.get('scheduled_at')
        
        # Send the email
        response = email_service.send_email(
            to=data['to'],
            subject=data['subject'],
            html_content=data['html_content'],
            from_email=from_email,
            cc=cc,
            bcc=bcc,
            scheduled_at=scheduled_at
        )
        
        return jsonify({'message': 'Email sent successfully', 'id': response.get('id')}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to send email: {str(e)}'}), 500

@email_bp.route('/api/emails/schedule', methods=['POST'])
@login_required
def schedule_email():
    """
    Schedule an email for future delivery.
    Required JSON fields: to, subject, html_content, scheduled_at
    Optional JSON fields: cc, bcc
    """
    try:
        data = request.get_json()
        
        # Required fields
        required_fields = ['to', 'subject', 'html_content', 'scheduled_at']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
                
        # Optional fields with defaults
        from_email = data.get('from_email')
        cc = data.get('cc')
        bcc = data.get('bcc')
        
        # Send the email
        response = email_service.send_email(
            to=data['to'],
            subject=data['subject'],
            html_content=data['html_content'],
            from_email=from_email,
            cc=cc,
            bcc=bcc,
            scheduled_at=data['scheduled_at']
        )
        
        return jsonify({'message': 'Email scheduled successfully', 'id': response.get('id')}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to schedule email: {str(e)}'}), 500

@email_bp.route('/api/emails/cancel/<email_id>', methods=['DELETE'])
@login_required
def cancel_email(email_id):
    """
    Cancel a scheduled email.
    """
    try:
        response = email_service.cancel_scheduled_email(email_id)
        return jsonify({'message': 'Email canceled successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to cancel email: {str(e)}'}), 500

@email_bp.route('/api/emails/reschedule/<email_id>', methods=['PUT'])
@login_required
def reschedule_email(email_id):
    """
    Reschedule an email.
    Required JSON fields: scheduled_at
    """
    try:
        data = request.get_json()
        
        if 'scheduled_at' not in data:
            return jsonify({'error': 'Missing required field: scheduled_at'}), 400
            
        response = email_service.reschedule_email(email_id, data['scheduled_at'])
        return jsonify({'message': 'Email rescheduled successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to reschedule email: {str(e)}'}), 500 