import uuid
from datetime import timedelta
from django.utils import timezone
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import get_user_model
from django.conf import settings
import logging
from notifications.utils import send_transactional_email
from .models import OTP
from .serializers_password_reset import (
    RequestPasswordResetSerializer,
    VerifyPasswordResetOTPSerializer,
    SetNewPasswordSerializer
)

User = get_user_model()

class RequestPasswordResetView(APIView):
    """
    Step 1: Request password reset OTP
    POST /api/auth/request-password-reset/
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RequestPasswordResetSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        
        # Rate limiting check
        rate_limit_key = f'password_reset_rate_limit_{email}'
        request_count = cache.get(rate_limit_key, 0)
        if request_count >= 5:  # 5 requests per hour limit
            return Response({
                'message': 'Too many password reset attempts. Please try again later.'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Return success even if email doesn't exist (security through obscurity)
            return Response({
                'message': 'If an account exists with this email, you will receive a password reset code.'
            }, status=status.HTTP_200_OK)

        # Generate and save OTP
        otp_instance = OTP.generate_otp(email)

        # Send OTP via email
        subject = f"{settings.PROJECT_NAME} - Password Reset Code"
        context = {
            'project_name': settings.PROJECT_NAME,
            'otp_code': otp_instance.otp
        }

        try:
            logger = logging.getLogger(__name__)
            sent = send_transactional_email(
                subject=subject,
                recipient_list=[email],
                template_name='notifications/password_reset_email.html',
                context=context,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
                fail_silently=False,
            )
            if not sent:
                logger.error('send_transactional_email returned 0 for password reset to %s', email)
                return Response({
                    'message': 'Error sending email. Please try again later.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Increment rate limit counter
            cache.set(rate_limit_key, request_count + 1, timeout=3600)  # 1 hour expiry

            return Response({
                'message': 'Password reset code has been sent to your email.'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logging.getLogger(__name__).exception('Error sending password reset email')
            return Response({
                'message': 'Error sending email. Please try again later.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyPasswordResetOTPView(APIView):
    """
    Step 2: Verify OTP and get reset token
    POST /api/auth/verify-password-reset-otp/
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyPasswordResetOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        otp_code = serializer.validated_data['otp']

        try:
            # Get latest unused OTP
            otp_obj = OTP.objects.filter(
                email=email,
                is_used=False
            ).latest('created_at')

            if not otp_obj.is_valid():
                return Response({
                    'message': 'OTP has expired. Please request a new one.'
                }, status=status.HTTP_400_BAD_REQUEST)

            if otp_obj.otp != otp_code:
                return Response({
                    'message': 'Invalid OTP'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Mark OTP as used
            otp_obj.is_used = True
            otp_obj.save()

            # Generate reset token
            reset_token = str(uuid.uuid4())
            
            # Store token in cache with 5-minute expiry
            token_key = f'password_reset_token_{reset_token}'
            cache.set(token_key, email, timeout=300)  # 5 minutes

            return Response({
                'message': 'OTP verified successfully',
                'reset_token': reset_token
            }, status=status.HTTP_200_OK)

        except OTP.DoesNotExist:
            return Response({
                'message': 'Invalid or expired OTP'
            }, status=status.HTTP_400_BAD_REQUEST)


class SetNewPasswordView(APIView):
    """
    Step 3: Set new password using reset token
    POST /api/auth/set-new-password/
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SetNewPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        reset_token = str(serializer.validated_data['reset_token'])
        new_password = serializer.validated_data['new_password']

        # Get email from cache using reset token
        token_key = f'password_reset_token_{reset_token}'
        email = cache.get(token_key)

        if not email:
            return Response({
                'message': 'Invalid or expired reset token'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()

            # Invalidate the reset token
            cache.delete(token_key)

            return Response({
                'message': 'Password has been reset successfully'
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({
                'message': 'User not found'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'message': 'Error resetting password'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)