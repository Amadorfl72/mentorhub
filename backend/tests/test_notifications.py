import unittest
from flask import Flask
#from flask_mail import Mail
from backend.utils.notifications import send_email
from dotenv import load_dotenv
import os

class TestEmailSending(unittest.TestCase):
    def setUp(self):
        # Load environment variables from .env file
        load_dotenv()

        # Set up a Flask app context for testing
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.app.config['MAIL_SUPPRESS_SEND'] = True  # Suppress sending emails
        self.app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
        self.app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
        self.app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'true').lower() in ['true', '1', 't']
        self.app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
        self.app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
        self.app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')
        
        self.mail = Mail(self.app)
        self.app.extensions['mail'] = self.mail

    def test_send_email(self):
        with self.app.app_context():
            with self.mail.record_messages() as outbox:
                send_email('Test Subject', ['recipient@example.com'], 'Test Body')
                
                # Check that an email was sent
                self.assertEqual(len(outbox), 1)
                self.assertEqual(outbox[0].subject, 'Test Subject')
                self.assertEqual(outbox[0].recipients, ['recipient@example.com'])
                self.assertEqual(outbox[0].body, 'Test Body')

if __name__ == '__main__':
    unittest.main() 