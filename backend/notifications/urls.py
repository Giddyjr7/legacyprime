from django.urls import path
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .utils import send_transactional_email
from django.conf import settings
import json

@csrf_exempt
def send_otp(request):
    if request.method != 'POST':
        return JsonResponse({'detail': 'Method not allowed'}, status=405)
    data = json.loads(request.body.decode('utf-8'))
    email = data.get('email')
    otp_code = data.get('otp_code')
    if not email or not otp_code:
        return JsonResponse({'detail': 'email and otp_code required'}, status=400)
    try:
        sent = send_transactional_email(
            subject=f"{settings.PROJECT_NAME} - Your verification code",
            recipient_list=[email],
            template_name='notifications/otp_email.html',
            context={'project_name': settings.PROJECT_NAME, 'otp_code': otp_code},
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
            fail_silently=False,
        )
        if not sent:
            return JsonResponse({'detail': 'Failed to send OTP'}, status=500)
        return JsonResponse({'detail': 'OTP sent'}, status=200)
    except Exception as e:
        return JsonResponse({'detail': str(e)}, status=500)

urlpatterns = [
    path('send-otp/', send_otp, name='send-otp'),
    path('debug/cors/', lambda request: JsonResponse({
        'ok': True,
        'origin': request.META.get('HTTP_ORIGIN'),
        'method': request.method,
    }), name='debug-cors'),
]
