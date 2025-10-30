from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class RequestPasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

class VerifyPasswordResetOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)

class SetNewPasswordSerializer(serializers.Serializer):
    # The API accepts a reset token and the new password. Password confirmation
    # is handled on the client side so we don't require it here.
    reset_token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate_reset_token(self, value):
        # Accept UUID strings or plain strings; further validation is done in the view
        if not value:
            raise serializers.ValidationError("Reset token is required")
        return value