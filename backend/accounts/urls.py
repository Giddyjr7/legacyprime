from django.urls import path
from .views import RegisterView, LoginView, LogoutView, ProfileView, VerifyOTPView, ResendOTPView, CSRFCookieView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('csrf/', CSRFCookieView.as_view(), name='csrf'),
]
