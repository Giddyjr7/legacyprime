from django.contrib.auth import login, logout, authenticate, get_user_model
from rest_framework import status, permissions, parsers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.core.mail import EmailMessage
from django.conf import settings
from django.template.loader import render_to_string
from .models import OTP
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, UserProfileSerializer, ChangePasswordSerializer

User = get_user_model()

class RegisterView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            # Create inactive user
            user = serializer.save(is_active=False, is_email_verified=False)
            email = user.email
            
            # Generate OTP
            otp_instance = OTP.generate_otp(email)
            
            # Send OTP via email
            subject = f"{settings.PROJECT_NAME} - Email Verification"
            
            # Prepare context for email template
            context = {
                'project_name': settings.PROJECT_NAME,
                'otp_code': otp_instance.otp
            }
            
            # Render email template
            html_message = render_to_string(
                'notifications/otp_email.html',
                context
            )
            
            try:
                # Check if email settings are configured
                if not all([settings.EMAIL_HOST, settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD]):
                    missing_settings = {
                        'host': not bool(settings.EMAIL_HOST),
                        'user': not bool(settings.EMAIL_HOST_USER),
                        'password': not bool(settings.EMAIL_HOST_PASSWORD)
                    }
                    print("Missing email settings:", {k: v for k, v in missing_settings.items() if v})
                    return Response({
                        "message": "Email service not configured properly. Please contact support."
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                # Create the email message
                email_message = EmailMessage(
                    subject,
                    html_message,
                    f'{settings.PROJECT_NAME} <{settings.EMAIL_HOST_USER}>',
                    [email]
                )
                email_message.content_subtype = "html"
                
                # Print debug info
                print(f"Attempting to send email via {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
                print(f"Using email account: {settings.EMAIL_HOST_USER}")
                print(f"TLS Enabled: {settings.EMAIL_USE_TLS}")
                
                # Send email with extensive error handling
                from socket import timeout as SocketTimeout
                import ssl
                
                try:
                    print("Email configuration:")
                    print(f"- Host: {settings.EMAIL_HOST}")
                    print(f"- Port: {settings.EMAIL_PORT}")
                    print(f"- TLS: {settings.EMAIL_USE_TLS}")
                    print(f"- From: {settings.EMAIL_HOST_USER}")
                    print(f"- Timeout: {settings.EMAIL_TIMEOUT}")
                    
                    # Try sending with a shorter timeout first
                    email_message.send(fail_silently=False)
                    print("Email sent successfully")
                    
                except (SocketTimeout, TimeoutError) as e:
                    print(f"Connection timed out: {str(e)}")
                    return Response({
                        "message": "Email service is temporarily unavailable. Please try again in a few minutes.",
                        "error": "connection_timeout"
                    }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
                    
                except ssl.SSLError as e:
                    print(f"SSL Error: {str(e)}")
                    return Response({
                        "message": "Secure connection failed. Please contact support.",
                        "error": "ssl_error"
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
                except Exception as e:
                    error_msg = str(e)
                    print(f"Failed to send email: {error_msg}")
                    
                    if "EMAIL_USE_TLS/EMAIL_USE_SSL" in error_msg:
                        print("TLS/SSL configuration error detected")
                        return Response({
                            "message": "Email service misconfigured. Please contact support.",
                            "error": "tls_config_error"
                        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                        
                    elif "Authentication Required" in error_msg or "Authentication unsuccessful" in error_msg:
                        print("Gmail authentication error - check app password")
                        return Response({
                            "message": "Email authentication failed. Please contact support.",
                            "error": "auth_error"
                        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                        
                    elif "Connection refused" in error_msg:
                        print("Connection refused - check firewall/network")
                        return Response({
                            "message": "Could not connect to email service. Please try again later.",
                            "error": "connection_refused"
                        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
                        
                    # For any other unexpected errors
                    return Response({
                        "message": "An unexpected error occurred while sending email. Please try again.",
                        "error": "unknown_error"
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                # Store registration data in session
                registration_data = {
                    'email': email,
                    'username': serializer.validated_data['username'],
                    'password': serializer.validated_data['password'],
                    'password2': serializer.validated_data['password2'],
                    'first_name': serializer.validated_data.get('first_name', ''),
                    'last_name': serializer.validated_data.get('last_name', '')
                }
                request.session['registration_data'] = registration_data
                request.session.modified = True  # Mark session as modified
                
                # Debug session data
                print("Session data stored:", request.session.get('registration_data'))
                
                response = Response({
                    "message": "Verification code sent to your email",
                    "email": email
                }, status=status.HTTP_200_OK)
                
                # Ensure session cookie is set
                response.set_cookie(
                    settings.SESSION_COOKIE_NAME,
                    request.session.session_key,
                    max_age=settings.SESSION_COOKIE_AGE,
                    httponly=settings.SESSION_COOKIE_HTTPONLY,
                    samesite=settings.SESSION_COOKIE_SAMESITE,
                )
                
                return response
                
            except Exception as e:
                return Response({
                    "message": "Failed to send verification email",
                    "error": str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request, user)
            return Response({
                "user": UserSerializer(user).data,
                "message": "Login Successful"
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        logout(request)
        return Response({"message": "Successfully Logged out"})

class ProfileView(APIView):
    """API View to handle user profile operations including profile picture upload."""
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
            # Return the updated profile data
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
                # Find the pending user
                user = User.objects.get(email=email, is_active=False, is_email_verified=False)
                
                # Activate user
                user.is_active = True
                user.is_email_verified = True
                user.save()
                
                # Log the user in
                login(request, user)
                
                return Response({
                    "user": UserSerializer(user).data,
                    "message": "Email verified and account activated successfully"
                }, status=status.HTTP_200_OK)
                
            except User.DoesNotExist:
                return Response({
                    "message": "No pending registration found for this email"
                }, status=status.HTTP_400_BAD_REQUEST)
                
            except Exception as e:
                print("Error activating user:", str(e))
                return Response({
                    "message": "Error activating user account",
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
        
        # Render email template
        html_message = render_to_string(
            'notifications/otp_email.html',
            context
        )
        
        try:
            email_message = EmailMessage(
                subject,
                html_message,
                settings.EMAIL_HOST_USER,
                [email]
            )
            email_message.content_subtype = "html"
            email_message.send(fail_silently=False)
            return Response({
                "message": "New verification code sent"
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "message": "Error sending verification email",
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ChangePasswordView(APIView):
    """Allow an authenticated user to change their password.

    Expected JSON:
    {
      "current_password": "...",
      "new_password": "...",
      "confirm_password": "..."
    }
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        current = serializer.validated_data.get('current_password')
        new_password = serializer.validated_data.get('new_password')

        # Verify current password
        if not user.check_password(current):
            return Response({"current_password": ["Current password is incorrect."]}, status=status.HTTP_400_BAD_REQUEST)

        # Additional password validation (validators run via serializer, but re-run to be explicit)
        try:
            from django.contrib.auth.password_validation import validate_password
            validate_password(new_password, user)
        except Exception as e:
            # e may be a ValidationError with messages
            try:
                return Response({"new_password": e.messages}, status=status.HTTP_400_BAD_REQUEST)
            except Exception:
                return Response({"new_password": [str(e)]}, status=status.HTTP_400_BAD_REQUEST)

        # Set the new password
        user.set_password(new_password)
        user.save()

        # Keep the user logged in: do not log them out or invalidate tokens here.
        # The password has been set and saved above.
        return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)


@method_decorator(ensure_csrf_cookie, name='dispatch')
class CSRFCookieView(APIView):
    """Simple endpoint to ensure a csrftoken cookie is set for the frontend.

    Call this with GET (credentials included) before making state-changing requests
    from the frontend to ensure the `csrftoken` cookie exists.
    """
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        return Response(status=status.HTTP_204_NO_CONTENT)
