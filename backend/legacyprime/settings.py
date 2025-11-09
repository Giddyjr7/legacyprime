import os
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url
from datetime import timedelta

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# --- CORE SETTINGS ---
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("DJANGO_SECRET_KEY not set in environment")

DEBUG = os.environ.get('DJANGO_DEBUG', 'False').lower() == 'true'
IS_PRODUCTION = not DEBUG

# --- HOSTS ---
RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
VERCEL_FRONTEND_ORIGIN = os.environ.get('VERCEL_FRONTEND_ORIGIN', 'https://legacyprime.vercel.app')

# Dynamic allowed hosts for both development and production
ALLOWED_HOSTS = []

if DEBUG:
    # Development hosts
    ALLOWED_HOSTS.extend(['localhost', '127.0.0.1', '0.0.0.0'])
else:
    # Production hosts
    if RENDER_EXTERNAL_HOSTNAME:
        ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)
    
    # Add Vercel domains
    if VERCEL_FRONTEND_ORIGIN:
        vercel_domain = VERCEL_FRONTEND_ORIGIN.replace("https://", "").replace("http://", "")
        ALLOWED_HOSTS.append(vercel_domain)
        ALLOWED_HOSTS.append('legacy-prime.vercel.app')

# Add any extra hosts from environment
extra_hosts = os.environ.get('DJANGO_ALLOWED_HOSTS', '')
if extra_hosts:
    ALLOWED_HOSTS.extend([h.strip() for h in extra_hosts.split(',') if h.strip()])

ALLOWED_HOSTS = list(dict.fromkeys(ALLOWED_HOSTS))

# --- INSTALLED APPS ---
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    'accounts',
    'transactions',
    'wallet',
    'notifications',
]

# --- MIDDLEWARE ---
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
    'legacyprime.jwt_debug.JWTDebugMiddleware',  # Moved after AuthenticationMiddleware
]

ROOT_URLCONF = 'legacyprime.urls'

# --- TEMPLATES ---
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
ASGI_APPLICATION = 'legacyprime.asgi.application'

# --- DATABASE ---
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    # Production database (PostgreSQL on Render)
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    # Development database (SQLite)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# --- CHANNELS ---
if IS_PRODUCTION:
    # Production Redis configuration (if using Redis on Render)
    REDIS_URL = os.environ.get('REDIS_URL')
    if REDIS_URL:
        CHANNEL_LAYERS = {
            'default': {
                'BACKEND': 'channels_redis.core.RedisChannelLayer',
                'CONFIG': {
                    'hosts': [REDIS_URL],
                },
            },
        }
    else:
        CHANNEL_LAYERS = {'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'}}
else:
    # Development
    CHANNEL_LAYERS = {'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'}}

# --- USER MODEL ---
AUTH_USER_MODEL = 'accounts.User'

# --- CORS CONFIGURATION ---
CORS_ALLOWED_ORIGINS = []

if DEBUG:
    # Development origins
    CORS_ALLOWED_ORIGINS.extend([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080", 
        "http://127.0.0.1:8080",
    ])
else:
    # Production origins
    if VERCEL_FRONTEND_ORIGIN:
        CORS_ALLOWED_ORIGINS.append(VERCEL_FRONTEND_ORIGIN)
        CORS_ALLOWED_ORIGINS.append("https://legacy-prime.vercel.app")
    
    # Add Render backend URL for potential frontend-backend communication
    if RENDER_EXTERNAL_HOSTNAME:
        CORS_ALLOWED_ORIGINS.append(f"https://{RENDER_EXTERNAL_HOSTNAME}")

# Additional CORS settings
CORS_ALLOW_CREDENTIALS = False
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-requested-with',
    'x-csrftoken',
]
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_EXPOSE_HEADERS = ['Content-Type', 'Authorization']

# Security settings for production
if IS_PRODUCTION:
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True

# --- JWT CONFIGURATION ---
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',
    'JTI_CLAIM': 'jti',
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}

# --- REST FRAMEWORK ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'accounts.authentication.CustomJWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
}

# Remove Browsable API in production
if not DEBUG:
    REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [
        'rest_framework.renderers.JSONRenderer',
    ]

# --- STATIC & MEDIA FILES ---
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# For production, you might want to use cloud storage for media files
if IS_PRODUCTION and os.environ.get('AWS_ACCESS_KEY_ID'):
    # AWS S3 Configuration (optional)
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = os.environ.get('AWS_S3_REGION_NAME', 'us-east-1')
    AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'

# --- GENERAL SETTINGS ---
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- EMAIL SETTINGS ---
EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'legacyprime.sendgrid_backend.SendGridEmailBackend')
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', 'apikey')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@legacyprime.com')
EMAIL_HOST_PASSWORD = os.environ.get('SENDGRID_API_KEY', '')
EMAIL_DEBUG = DEBUG

PROJECT_NAME = "Legacy Prime"

# --- LOGGING ---
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
        'accounts': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}