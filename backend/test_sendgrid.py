import os
import django
from django.core.mail import send_mail
from django.conf import settings
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'legacyprime.settings')
django.setup()

def test_sendgrid():
    try:
        print("\nTesting SendGrid email configuration...")
        print(f"Using backend: {settings.EMAIL_BACKEND}")
        print(f"From email: {settings.DEFAULT_FROM_EMAIL}")
        
        send_mail(
            subject='Test Email from LegacyPrime via SendGrid',
            message='This is a test email sent using SendGrid.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.DEFAULT_FROM_EMAIL],  # Sending to yourself
            fail_silently=False,
            html_message='<h1>Test Email</h1><p>This is a test email sent using SendGrid.</p>'
        )
        print("\n✓ Test email sent successfully!")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        print(f"Error type: {type(e).__name__}")

if __name__ == '__main__':
    test_sendgrid()