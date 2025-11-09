from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.conf import settings
from rest_framework.authentication import CSRFCheck
from rest_framework import exceptions
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)

class CustomJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication class that adds additional logging and validation.
    """
    def authenticate(self, request):
        try:
            header = self.get_header(request)
            if header is None:
                logger.debug("No JWT header found")
                return None

            raw_token = self.get_raw_token(header)
            if raw_token is None:
                logger.debug("No raw token found in header")
                return None

            validated_token = self.get_validated_token(raw_token)
            logger.debug(f"Token validation successful - Payload: {validated_token.payload}")

            user = self.get_user(validated_token)
            logger.debug(f"User retrieved from token: {user.email if user else 'None'}")

            if user is None:
                logger.error("User not found from token payload")
                raise exceptions.AuthenticationFailed('User not found')

            if not user.is_active:
                logger.error(f"User {user.email} is not active")
                raise exceptions.AuthenticationFailed('User is inactive')

            # Set request.user early to ensure it's available
            request.user = user
            
            return user, validated_token

        except InvalidToken as e:
            logger.error(f"Invalid token error: {str(e)}")
            raise exceptions.AuthenticationFailed(f'Invalid token: {str(e)}')
        except TokenError as e:
            logger.error(f"Token error: {str(e)}")
            raise exceptions.AuthenticationFailed(f'Token error: {str(e)}')
        except Exception as e:
            logger.error(f"Unexpected authentication error: {str(e)}")
            raise exceptions.AuthenticationFailed('Authentication failed')

    def authenticate_header(self, request):
        """
        Return the authentication header format expected from clients.
        """
        return 'Bearer realm="api"'