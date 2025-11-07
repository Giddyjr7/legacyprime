from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, ProfileView, VerifyOTPView, ResendOTPView, PasswordResetOTPView, ChangePasswordView
from django.conf import settings
from .views_password_reset import (
    RequestPasswordResetView,
    VerifyPasswordResetOTPView,
    SetNewPasswordView
)
from .views import CustomTokenObtainPairView

urlpatterns = [
    # JWT Authentication endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # User registration and verification
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    
    # User profile
    path('profile/', ProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    
    # Password Reset Flow
    path('request-password-reset/', RequestPasswordResetView.as_view(), name='request-password-reset'),
    path('verify-password-reset-otp/', VerifyPasswordResetOTPView.as_view(), name='verify-password-reset-otp'),
    path('set-new-password/', SetNewPasswordView.as_view(), name='set-new-password'),
]

# Debug-only endpoints - remove SessionDebugView since we're not using sessions
# if getattr(settings, 'DEBUG', False):
#     urlpatterns += [
#         # Add any debug endpoints if needed, but remove session debug
#     ]