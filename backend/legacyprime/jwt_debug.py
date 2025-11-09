import logging
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.http import HttpRequest

class JWTDebugMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.logger = logging.getLogger(__name__)
        self.jwt_auth = JWTAuthentication()

    def __call__(self, request: HttpRequest):
        response = self.get_response(request)
        
        # Log authentication details after response
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        self.logger.info(f"JWT Debug - Path: {request.path}")
        self.logger.info(f"JWT Debug - Auth Header: {auth_header}")
        self.logger.info(f"JWT Debug - User: {request.user}")
        self.logger.info(f"JWT Debug - User authenticated: {request.user.is_authenticated}")
        
        # If user is anonymous but has token, debug the token
        if not request.user.is_authenticated and auth_header.startswith('Bearer '):
            try:
                validated_token = self.jwt_auth.get_validated_token(auth_header.split()[1])
                self.logger.info(f"JWT Debug - Token payload: {validated_token.payload}")
                auth_result = self.jwt_auth.get_user(validated_token)
                self.logger.info(f"JWT Debug - Token validation result: {auth_result}")
            except Exception as e:
                self.logger.error(f"JWT Debug - Token validation error: {str(e)}")
        
        return response