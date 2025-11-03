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

def test_email():
    try:
        print("\nTesting email with Django's email system...")
        print(f"Using backend: {settings.EMAIL_BACKEND}")
        print(f"Host: {settings.EMAIL_HOST}")
        print(f"Port: {settings.EMAIL_PORT}")
        print(f"TLS: {settings.EMAIL_USE_TLS}")
        print(f"SSL: {settings.EMAIL_USE_SSL}")
        print(f"From: {settings.EMAIL_HOST_USER}")
        
        recipient = settings.EMAIL_HOST_USER  # Send to self for testing
        
        send_mail(
            subject='Test Email from LegacyPrime',
            message='This is a test email. If you see this in the console, the console backend is working.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )
        print("\n✓ Test email processed successfully!")
        print("Check your console output for the email content.")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        print(f"Error type: {type(e).__name__}")

if __name__ == '__main__':
    test_email()