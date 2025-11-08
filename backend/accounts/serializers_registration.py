from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator
from .models import PendingRegistration
import re

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'first_name', 'last_name')
        extra_kwargs = {
            'password': {'write_only': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate_username(self, value):
        # Validate length (4-20 characters)
        if len(value) < 4 or len(value) > 20:
            raise serializers.ValidationError(
                'Username must be between 4 and 20 characters.'
            )
        
        # Validate alphanumeric only
        if not re.match(r'^[a-zA-Z0-9]+$', value):
            raise serializers.ValidationError(
                'Username can only contain letters and numbers.'
            )
        
        # Check uniqueness in both User and PendingRegistration models
        if User.objects.filter(username=value).exists() or \
           PendingRegistration.objects.filter(username=value).exists():
            raise serializers.ValidationError('This username is already taken.')
        
        return value

    def validate_password(self, value):
        # Validate length
        if len(value) < 8:
            raise serializers.ValidationError(
                'Password must be at least 8 characters.'
            )
        
        # Validate uppercase
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError(
                'Password must contain at least one uppercase letter.'
            )
        
        # Validate lowercase
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError(
                'Password must contain at least one lowercase letter.'
            )
        
        # Validate number
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError(
                'Password must contain at least one number.'
            )
        
        return value

    def validate(self, attrs):
        # Validate password confirmation
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                'password2': "Passwords don't match."
            })
        
        # Validate email uniqueness
        email = attrs.get('email')
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({
                'email': 'This email is already registered.'
            })
        
        return attrs

    def create(self, validated_data):
        # Remove password confirmation before creating user
        validated_data.pop('password2', None)
        
        # Create the user
        user = User.objects.create_user(**validated_data)
        return user