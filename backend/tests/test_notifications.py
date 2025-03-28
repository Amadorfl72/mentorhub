import unittest
from unittest.mock import patch, MagicMock
from app.utils.notifications import send_email
from dotenv import load_dotenv
import os

class TestEmailSending(unittest.TestCase):
    def setUp(self):
        # Load environment variables from .env file
        load_dotenv()
        
        # Set up a Flask app context for testing
        self.app_patcher = patch('app.services.email_service.current_app')
        self.mock_app = self.app_patcher.start()
        self.mock_app.logger = MagicMock()
        
        # Mock Resend API
        self.resend_patcher = patch('resend.Emails.send')
        self.mock_resend = self.resend_patcher.start()
        self.mock_resend.return_value = {'id': 'test-email-id'}

    def tearDown(self):
        self.app_patcher.stop()
        self.resend_patcher.stop()

    def test_send_email(self):
        # Test sending an email
        result = send_email(
            subject='Test Subject',
            recipients=['recipient@example.com'],
            body='Test Body'
        )
        
        # Check that Resend API was called with correct parameters
        self.mock_resend.assert_called_once()
        call_args = self.mock_resend.call_args[0][0]
        
        self.assertEqual(call_args['subject'], 'Test Subject')
        self.assertEqual(call_args['to'], ['recipient@example.com'])
        self.assertIn('<pre>Test Body</pre>', call_args['html'])
        
        # Check that a success message was logged
        self.mock_app.logger.info.assert_called_once()

if __name__ == '__main__':
    unittest.main() 