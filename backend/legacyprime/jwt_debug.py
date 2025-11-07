import logging

class JWTDebugMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.logger = logging.getLogger(__name__)

    def __call__(self, request):
        # Log JWT authentication details
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        self.logger.info(f"JWT Debug - Path: {request.path}")
        self.logger.info(f"JWT Debug - Auth Header: {auth_header}")
        self.logger.info(f"JWT Debug - User: {request.user}")
        self.logger.info(f"JWT Debug - User authenticated: {request.user.is_authenticated}")
        
        response = self.get_response(request)
        return response