from django.urls import path
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .utils import send_otp_email
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
        send_otp_email(email, otp_code)
        return JsonResponse({'detail': 'OTP sent'}, status=200)
    except Exception as e:
        return JsonResponse({'detail': str(e)}, status=500)

urlpatterns = [
    path('send-otp/', send_otp, name='send-otp'),
]
