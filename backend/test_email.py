import os
from django.core.mail import send_mail
from django.conf import settings
import django
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'legacyprime.settings')
django.setup()

def test_email():
    try:
        print("Email settings:")
        print(f"HOST: {settings.EMAIL_HOST}")
        print(f"PORT: {settings.EMAIL_PORT}")
        print(f"USER: {settings.EMAIL_HOST_USER}")
        print(f"TLS: {settings.EMAIL_USE_TLS}")
        print(f"PASSWORD: {'*' * len(settings.EMAIL_HOST_PASSWORD)}")
        print("\nAttempting to send test email...")
        
        send_mail(
            subject='Test Email from LegacyPrime',
            message='This is a test email to verify the email configuration.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.EMAIL_HOST_USER],
            fail_silently=False,
        )
        print("Email sent successfully!")
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        print(f"Error type: {type(e).__name__}")

if __name__ == '__main__':
    test_email()