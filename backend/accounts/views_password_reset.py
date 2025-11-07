from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import get_user_model
from django.conf import settings
import logging
from notifications.utils import send_transactional_email
from .models import OTP

User = get_user_model()

class RequestPasswordResetView(APIView):
    """Send an OTP to an existing user's email for password reset."""
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"message": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Return success even if email doesn't exist (security best practice)
            return Response({
                "message": "If an account exists with this email, you will receive a password reset code."
            }, status=status.HTTP_200_OK)

        # Generate OTP
        otp_instance = OTP.generate_otp(email)

        # Send OTP via email
        subject = f"{settings.PROJECT_NAME} - Password Reset Code"
        context = {
            'project_name': settings.PROJECT_NAME,
            'otp_code': otp_instance.otp
        }

        try:
            sent = send_transactional_email(
                subject=subject,
                recipient_list=[email],
                template_name='notifications/otp_email.html',
                context=context,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
                fail_silently=False,
            )
            if not sent:
                logging.getLogger(__name__).error('send_transactional_email returned 0 for %s', email)
                return Response({"message": "Error sending email", "error": "send_failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response({"message": "OTP sent to your email"}, status=status.HTTP_200_OK)
        except Exception as e:
            logging.getLogger(__name__).exception('Error sending password reset email')
            return Response({"message": "Error sending email", "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyPasswordResetOTPView(APIView):
    """Verify OTP for password reset."""
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        if not email or not otp:
            return Response({"message": "Email and OTP are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            otp_obj = OTP.objects.filter(
                email=email,
                is_used=False
            ).latest('created_at')

            if not otp_obj.is_valid():
                return Response({"message": "OTP has expired"}, status=status.HTTP_400_BAD_REQUEST)

            if otp_obj.otp != otp:
                return Response({"message": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

            # OTP is valid
            return Response({
                "message": "OTP verified successfully"
            }, status=status.HTTP_200_OK)

        except OTP.DoesNotExist:
            return Response({"message": "OTP not found or already used"}, status=status.HTTP_400_BAD_REQUEST)

class SetNewPasswordView(APIView):
    """Set new password after OTP verification (for logged-out users)"""
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        print("🔍 DEBUG - Set new password request data:", request.data)
        
        email = request.data.get('email')
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        # Validate required fields
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not otp:
            return Response({"error": "OTP is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not new_password:
            return Response({"error": "New password is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not confirm_password:
            return Response({"error": "Confirm password is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify passwords match
        if new_password != confirm_password:
            return Response({"error": "Passwords do not match"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify OTP
        try:
            otp_obj = OTP.objects.filter(
                email=email,
                is_used=False
            ).latest('created_at')
            
            if not otp_obj.is_valid():
                return Response({"error": "OTP has expired"}, status=status.HTTP_400_BAD_REQUEST)
                
            if otp_obj.otp != otp:
                return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)
                
        except OTP.DoesNotExist:
            return Response({"error": "OTP not found or already used"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Find user and update password
        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()
            
            # Mark OTP as used
            otp_obj.is_used = True
            otp_obj.save()
            
            print(f"🔍 DEBUG - Password updated successfully for user: {email}")
            
            return Response({
                "message": "Password updated successfully"
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"🔍 DEBUG - Error updating password: {str(e)}")
            return Response({
                "error": "Failed to update password"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)