from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.hashers import make_password
from rest_framework import status, permissions, parsers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.core.mail import EmailMessage
from django.conf import settings
from django.db import models
import logging
from notifications.utils import send_transactional_email
from .models import OTP, PendingRegistration
from .serializers import UserSerializer, UserProfileSerializer, ChangePasswordSerializer
from .serializers_registration import UserRegistrationSerializer as RegisterSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated

User = get_user_model()

class RegisterView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        try:
            serializer = RegisterSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            email = serializer.validated_data['email']
            username = serializer.validated_data['username']

            # Check if a pending registration already exists
            existing_pending = PendingRegistration.objects.filter(
                models.Q(email=email) | models.Q(username=username)
            ).first()

            if existing_pending:
                # Delete existing pending registration
                existing_pending.delete()

            # Create pending registration and store a hashed password
            # We store the hashed password so the raw password is never persisted.
            pending_registration = PendingRegistration.objects.create(
                email=email,
                username=username,
                first_name=serializer.validated_data['first_name'],
                last_name=serializer.validated_data['last_name'],
                password=make_password(serializer.validated_data['password'])
            )

            # Generate OTP
            otp_instance = OTP.generate_otp(email)

            # Send OTP via email
            subject = f"{settings.PROJECT_NAME} - Email Verification"

            # Prepare context for email template
            context = {
                'project_name': settings.PROJECT_NAME,
                'otp_code': otp_instance.otp
            }

            logger = logging.getLogger(__name__)
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
                    logger.error('send_transactional_email returned 0 for %s', email)
                    pending_registration.delete()
                    return Response({
                        'message': 'Failed to send verification email',
                        'error': 'send_failed'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            except Exception as e:
                logger.exception('Unexpected error when sending verification email')
                pending_registration.delete()
                return Response({
                    'message': 'An unexpected error occurred while sending email. Please try again.',
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response({
                "message": "Verification code sent to your email",
                "email": email
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logging.getLogger(__name__).exception('Unhandled exception in RegisterView.post')
            return Response({
                'message': 'An unexpected error occurred during registration.',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ProfileView(APIView):
    """API View to handle user profile operations including profile picture upload."""
    authentication_classes = [JWTAuthentication]
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser)

    def get(self, request):
        """Get the user's profile data including profile picture URL."""
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        """Update the user's profile data. Handles both JSON and multipart form data."""
        print("Profile update request:", request.data)

        # Use partial=True to allow partial updates
        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            user = serializer.save()
            return Response(UserProfileSerializer(user).data)
            
        print("Validation errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        """Handle partial updates. Uses same logic as PUT."""
        return self.put(request)

class VerifyOTPView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        otp_code = request.data.get('otp')
        
        if not email or not otp_code:
            return Response({
                "message": "Email and OTP are required"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Get latest OTP for this email
            otp_obj = OTP.objects.filter(
                email=email,
                is_used=False
            ).latest('created_at')

            if not otp_obj.is_valid():
                return Response({
                    "message": "OTP has expired. Please request a new one."
                }, status=status.HTTP_400_BAD_REQUEST)

            if otp_obj.otp != otp_code:
                return Response({
                    "message": "Invalid OTP"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Mark OTP as used
            otp_obj.is_used = True
            otp_obj.save()

            try:
                # Find the pending registration
                pending_registration = PendingRegistration.objects.get(email=email)

                # Create and activate the user. Use create() then assign the already-hashed
                # password directly to avoid double-hashing. This ensures the saved
                # password is the bcrypt/sha hashed value generated earlier.
                user = User.objects.create(
                    email=pending_registration.email,
                    username=pending_registration.username,
                    first_name=pending_registration.first_name,
                    last_name=pending_registration.last_name,
                    is_active=True,
                    is_email_verified=True
                )

                # Assign the hashed password (stored in PendingRegistration) and save
                user.password = pending_registration.password
                user.save(update_fields=['password', 'is_active', 'is_email_verified'])

                # Delete the pending registration
                pending_registration.delete()
                
                # Generate JWT tokens for the newly created user
                refresh = RefreshToken.for_user(user)
                
                return Response({
                    "user": UserSerializer(user).data,
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "message": "Email verified and account activated successfully"
                }, status=status.HTTP_200_OK)
                
            except PendingRegistration.DoesNotExist:
                return Response({
                    "message": "No pending registration found for this email"
                }, status=status.HTTP_400_BAD_REQUEST)
                
            except Exception as e:
                logging.getLogger(__name__).exception('Error creating user account')
                return Response({
                    "message": "Error creating user account",
                    "error": str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except OTP.DoesNotExist:
            return Response({
                "message": "OTP not found or already used"
            }, status=status.HTTP_400_BAD_REQUEST)

class ResendOTPView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({
                "message": "Email is required"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Check if there's a pending user
            user = User.objects.get(email=email, is_active=False, is_email_verified=False)
            
            # Generate new OTP
            otp_instance = OTP.generate_otp(email)
        except User.DoesNotExist:
            return Response({
                "message": "No pending registration found for this email"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Send OTP via email
        subject = f"{settings.PROJECT_NAME} - New Verification Code"
        
        # Prepare context for email template
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
                logging.getLogger(__name__).error('send_transactional_email returned 0 for resend OTP to %s', email)
                return Response({
                    "message": "Error sending verification email",
                    "error": "send_failed"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response({
                "message": "New verification code sent"
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logging.getLogger(__name__).exception('Error sending verification email')
            return Response({
                "message": "Error sending verification email",
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ChangePasswordView(APIView):
    """Allow an authenticated user to change their password."""
    authentication_classes = [JWTAuthentication]
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        print("🔍 DEBUG - Change password request data:", request.data)
        
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            print("🔍 DEBUG - Serializer validation errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        current = serializer.validated_data.get('current_password')
        new_password = serializer.validated_data.get('new_password')
        confirm_password = serializer.validated_data.get('confirm_password')

        # Verify current password
        if not user.check_password(current):
            print(f"🔍 DEBUG - Current password incorrect for user {user.email}")
            return Response({"current_password": ["Current password is incorrect."]}, status=status.HTTP_400_BAD_REQUEST)

        # Verify passwords match
        if new_password != confirm_password:
            return Response({"new_password": ["New passwords do not match."]}, status=status.HTTP_400_BAD_REQUEST)

        # Additional password validation
        try:
            from django.contrib.auth.password_validation import validate_password
            validate_password(new_password, user)
        except Exception as e:
            print(f"🔍 DEBUG - Password validation error: {str(e)}")
            try:
                return Response({"new_password": e.messages}, status=status.HTTP_400_BAD_REQUEST)
            except Exception:
                return Response({"new_password": [str(e)]}, status=status.HTTP_400_BAD_REQUEST)

        # Set the new password
        user.set_password(new_password)
        user.save()

        print(f"🔍 DEBUG - Password updated successfully for user {user.email}")

        # Generate NEW JWT tokens so user stays logged in
        refresh = RefreshToken.for_user(user)
        
        return Response({
            "detail": "Password updated successfully.",
            "access": str(refresh.access_token),
            "refresh": str(refresh)
        }, status=status.HTTP_200_OK)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        # Add custom claims
        data['user'] = UserSerializer(self.user).data
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer



class JWTDebugView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "message": "JWT authentication successful",
            "user_id": request.user.id,
            "user_email": request.user.email,
            "is_authenticated": request.user.is_authenticated
        })


class JWTTestView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "message": "JWT authentication is working!",
            "user_id": request.user.id,
            "user_email": request.user.email,
            "is_authenticated": request.user.is_authenticated
        })
    
class DebugAuthView(APIView):
    def get(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        return Response({
            "auth_header_received": auth_header,
            "user": str(request.user),
            "is_authenticated": request.user.is_authenticated,
            "user_id": getattr(request.user, 'id', None),
            "user_email": getattr(request.user, 'email', None)
        })
