from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
import os
from django.conf import settings

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile data including the profile picture."""
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'username', 'first_name', 'last_name', 
            'address', 'state', 'zip_code', 'city', 'country', 
            'mobile', 'profile_picture', 'profile_picture_url'
        )
        read_only_fields = ('id', 'email', 'username', 'profile_picture_url')
        extra_kwargs = {
            'profile_picture': {'write_only': True, 'required': False}
        }

    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.url
        return None

    def validate_profile_picture(self, value):
        if value:
            # Validate file type
            ext = os.path.splitext(value.name)[1].lower()
            valid_extensions = ['.jpg', '.jpeg', '.png']
            if ext not in valid_extensions:
                raise serializers.ValidationError(
                    "Only JPG, JPEG, and PNG files are allowed."
                )
            
            # Validate file size (max 5MB)
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError(
                    "File size cannot exceed 5MB."
                )
        return value

    def update(self, instance, validated_data):
        # Handle profile picture update
        profile_picture = validated_data.pop('profile_picture', None)
        if profile_picture:
            # Delete old picture if it exists
            if instance.profile_picture:
                try:
                    old_path = instance.profile_picture.path
                    if os.path.exists(old_path):
                        os.remove(old_path)
                except Exception as e:
                    print(f"Error deleting old profile picture: {e}")
            instance.profile_picture = profile_picture

        # Update other fields
        return super().update(instance, validated_data)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'address', 'state', 'zip_code', 'city', 'country')
        read_only_fields = ('id', 'email')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password2', 'first_name', 'last_name')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        # First check whether an account with this email exists. This lets us
        # give a clearer validation message when the email is unknown.
        if not User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({
                'email': ['No account found with that email.']
            })

        # Attempt authentication. If it fails, the password was incorrect (or
        # another auth backend prevented login).
        user = authenticate(email=email, password=password)
        if not user:
            raise serializers.ValidationError({
                'password': ['Incorrect password.']
            })

        # Optional: reject inactive users explicitly
        if not user.is_active:
            raise serializers.ValidationError({
                'non_field_errors': ['This account is inactive.']
            })

        data['user'] = user
        return data


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs.get('new_password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"new_password": "New passwords do not match."})
        return attrs