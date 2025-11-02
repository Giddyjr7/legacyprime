import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("No DJANGO_SECRET_KEY set in environment")

DEBUG = os.environ.get('DJANGO_DEBUG', 'False').lower() == 'true'

# Parse allowed hosts from environment variable
ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'channels',
    'accounts',
    'transactions',
    'wallet',
    'notifications',
]

# Channels configuration
ASGI_APPLICATION = 'legacyprime.asgi.application'
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer'
    }
}

# Use custom user model from accounts app
AUTH_USER_MODEL = 'accounts.User'

# CORS settings
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173,http://127.0.0.1:5173').split(',')
CORS_EXPOSE_HEADERS = [
    'content-type',
    'x-csrftoken',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'legacyprime.middleware.DebugMiddleware',  # Add debug middleware
]

# Configure logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django.request': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'legacyprime.middleware': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# CSRF settings (development)
# Allow cross-site cookie for local dev (Vite on a different port).
# In production, use 'Lax' or 'Strict' and set CSRF_COOKIE_SECURE=True.
# Use 'Lax' for development so browsers accept cookies over different ports on localhost.
# Note: Setting SameSite=None requires cookies to be Secure in modern browsers; since
# local development typically uses plain HTTP we avoid SameSite=None to prevent the
# browser rejecting cookies. For production with HTTPS, consider using SameSite=None
# and SESSION_COOKIE_SECURE = True.
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_HTTPONLY = False  # False because we read it in JS to set X-CSRFToken
CSRF_COOKIE_SECURE = False    # Set True in production when using HTTPS
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'https://legacyprime.onrender.com'
]
# Use cookie-based CSRF tokens (default). Setting this to False means the
# token will be in the cookie named 'csrftoken' which the frontend expects.
CSRF_USE_SESSIONS = False

ROOT_URLCONF = 'legacyprime.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'legacyprime.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static'
]

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# Additional CORS settings for production
# For credentials (cookies) to work, do NOT use CORS_ALLOW_ALL_ORIGINS = True when
# CORS_ALLOW_CREDENTIALS = True. Instead explicitly list allowed origins.
CORS_ALLOW_ALL_ORIGINS = False

# Media settings for uploaded files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Session Settings
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_AGE = 7 * 24 * 60 * 60  # 7 days in seconds
SESSION_EXPIRE_AT_BROWSER_CLOSE = False  # Keep session after browser close
SESSION_SAVE_EVERY_REQUEST = True  # Update session on every request

# Email (SMTP) - pull from env
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'  # Hard-code for reliability
EMAIL_PORT = 587  # Changed from 465 to 587
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
EMAIL_USE_TLS = True  # Changed from False to True (required for port 587)
EMAIL_USE_SSL = False   # Changed from True to False
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'no-reply@legacyprime.com')
EMAIL_TIMEOUT = 15     # Shorter timeout for faster failure
SMTP_DEBUG_LEVEL = 1   # Enable SMTP debug output


# Project name constant
PROJECT_NAME = 'LegacyPrime'
