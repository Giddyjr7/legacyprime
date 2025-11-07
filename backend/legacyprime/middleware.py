# import logging
# from django.http import HttpRequest

# logger = logging.getLogger(__name__)

# class DebugMiddleware:
#     def __init__(self, get_response):
#         self.get_response = get_response

#     def __call__(self, request: HttpRequest):
#         # Log auth status
#         if hasattr(request, 'user'):
#             logger.info(f"Request to {request.path} - User authenticated: {request.user.is_authenticated}")
#             if request.user.is_authenticated:
#                 logger.info(f"User ID: {request.user.id}")
        
#         # Log CSRF
#         csrf_cookie = request.COOKIES.get('csrftoken')
#         csrf_header = request.headers.get('X-CSRFToken')
#         if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
#             logger.info(f"CSRF Cookie present: {bool(csrf_cookie)}")
#             logger.info(f"CSRF Header present: {bool(csrf_header)}")
#             if csrf_cookie and csrf_header:
#                 logger.info(f"CSRF match: {csrf_cookie == csrf_header}")

#         # Log session
#         if hasattr(request, 'session'):
#             logger.info(f"Session key present: {bool(request.session.session_key)}")
            
#         response = self.get_response(request)
        
#         # Log response
#         if response.status_code in [401, 403]:
#             logger.warning(f"Auth failure {response.status_code} to {request.path}")
            
#         return response