from typing import Iterable, Optional, Dict, Any
import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def send_transactional_email(
    subject: str,
    recipient_list: Iterable[str],
    template_name: str,
    context: Optional[Dict[str, Any]] = None,
    from_email: Optional[str] = None,
    fail_silently: bool = False,
) -> int:
    """
    Render templates and send a transactional email using Django's email system.

    Behaviour:
    - Renders HTML using `template_name` (expected to live under
      `notifications/templates/notifications/` or the configured template dirs).
    - Looks for a plain-text fallback template with the same base name and
      `.txt` extension (e.g. `otp_email.html` -> `otp_email.txt`). If not
      found, falls back to stripping HTML to produce a plain-text version.
    - Sends the email via Django's configured `EMAIL_BACKEND` (your
      SendGrid backend will be used when configured in settings).

    Args:
        subject: Email subject line.
        recipient_list: Iterable of recipient email addresses.
        template_name: Template filename for HTML (e.g. 'notifications/otp_email.html'
                       or just 'otp_email.html' if template dirs are configured).
        context: Context dict used when rendering templates.
        from_email: Optional from email (defaults to settings.DEFAULT_FROM_EMAIL).
        fail_silently: If True, suppress exceptions from sending.

    Returns:
        Number of successfully sent messages (per Django's send API semantics).
    """

    context = context or {}
    from_email = from_email or getattr(settings, 'DEFAULT_FROM_EMAIL', None)

    # Ensure template path is reasonable: allow both 'otp_email.html' and
    # 'notifications/otp_email.html'. Prefer the provided value as-is.
    html_template = template_name

    # Determine plain text template name by swapping extension to .txt when possible
    if html_template.lower().endswith('.html'):
        txt_template = html_template[:-5] + '.txt'
    else:
        txt_template = html_template + '.txt'

    # Render HTML
    try:
        html_content = render_to_string(html_template, context)
    except Exception as e:
        logger.exception('Failed to render HTML template %s', html_template)
        raise

    # Render plain text if available, otherwise strip HTML
    plain_text = None
    try:
        plain_text = render_to_string(txt_template, context)
    except Exception:
        # If text template not found or rendering fails, fall back to stripping HTML
        plain_text = strip_tags(html_content)

    # Build and send the message using EmailMultiAlternatives so we support both
    # plain text and HTML alternatives.
    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_text,
            from_email=from_email,
            to=list(recipient_list),
        )
        # Attach the HTML alternative
        msg.attach_alternative(html_content, 'text/html')

        # Send and return number of recipients successfully delivered (Django semantics)
        result = msg.send(fail_silently=fail_silently)
        logger.info('Sent transactional email "%s" to %s (backend=%s)', subject, recipient_list, getattr(settings, 'EMAIL_BACKEND', ''))
        return result

    except Exception:
        logger.exception('Failed to send transactional email "%s" to %s', subject, recipient_list)
        if fail_silently:
            return 0
        raise

