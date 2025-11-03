from django.core.mail.backends.base import BaseEmailBackend
from django.conf import settings
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
import json

class SendGridEmailBackend(BaseEmailBackend):
    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently)
        self.sg = SendGridAPIClient(settings.EMAIL_HOST_PASSWORD)  # SendGrid API Key
        self.default_from_email = settings.DEFAULT_FROM_EMAIL

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        num_sent = 0
        for message in email_messages:
            try:
                # Convert Django email message to SendGrid format
                from_email = Email(message.from_email or self.default_from_email)
                
                for to_email in message.to:
                    mail = Mail(
                        from_email=from_email,
                        to_emails=To(to_email),
                        subject=message.subject,
                        html_content=message.body if message.content_subtype == 'html' else None,
                        plain_text_content=message.body if message.content_subtype != 'html' else None
                    )

                    # Send the email
                    response = self.sg.send(mail)
                    
                    if response.status_code in [200, 201, 202]:
                        num_sent += 1
                    else:
                        if not self.fail_silently:
                            raise Exception(f"SendGrid API error: {response.status_code} - {response.body}")
                            
            except Exception as e:
                if not self.fail_silently:
                    raise
                
        return num_sent