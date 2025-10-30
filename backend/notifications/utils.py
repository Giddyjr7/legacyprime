from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings


def send_otp_email(email: str, otp_code: str):
    """Render an HTML OTP email using the notifications template and send via SMTP."""
    subject = f"{settings.PROJECT_NAME} - Your verification code"
    context = {
        'project_name': settings.PROJECT_NAME,
        'otp_code': otp_code,
    }
    html_content = render_to_string('notifications/otp_email.html', context)
    text_content = f"Your {settings.PROJECT_NAME} verification code is: {otp_code}"

    msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [email])
    msg.attach_alternative(html_content, "text/html")
    msg.send(fail_silently=False)
