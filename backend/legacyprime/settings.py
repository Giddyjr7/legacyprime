import os
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url
from datetime import timedelta 

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("No DJANGO_SECRET_KEY set in environment")

# Set DEBUG based on environment variable, defaults to False for safety
DEBUG = os.environ.get('DJANGO_DEBUG', 'False').lower() == 'true'

# Determine if we are running in a production-like environment (DEBUG is False)
IS_PRODUCTION = not DEBUG 

# --- ALLOWED HOSTS ---
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'legacyprime.onrender.com',
    'legacyprime.vercel.app',
]

# Add Render external hostname if available
RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# Add extra hosts from env variable if needed
env_hosts = os.environ.get('DJANGO_ALLOWED_HOSTS', '').split(',')
ALLOWED_HOSTS.extend([host.strip() for host in env_hosts if host.strip()])
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
    'corsheaders',
    'channels',
    'accounts',
    'transactions',
    'wallet',
    'notifications',
]

# --- CHANNELS CONFIG ---
ASGI_APPLICATION = 'legacyprime.asgi.application'
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer'
    }
}

# --- CUSTOM USER MODEL ---
AUTH_USER_MODEL = 'accounts.User'

# --- CORS SETTINGS ---
CORS_ALLOW_CREDENTIALS = True
BASE_ALLOWED_ORIGINS = [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://legacyprime.vercel.app',
    'https://legacyprime.onrender.com',
]

ENV_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')
CORS_ALLOWED_ORIGINS = list(set(BASE_ALLOWED_ORIGINS + [o.strip() for o in ENV_ORIGINS if o.strip()]))

# Additional frontend origin (Vercel) used by the deployed frontend
VERCEL_FRONTEND_ORIGIN = os.environ.get('VERCEL_FRONTEND_ORIGIN', 'https://legacyprime-frontend.vercel.app')
if VERCEL_FRONTEND_ORIGIN and VERCEL_FRONTEND_ORIGIN not in CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS.append(VERCEL_FRONTEND_ORIGIN)

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
    'legacyprime.middleware.DebugMiddleware',
]

# --- SESSION (COOKIE) SETTINGS - LOCAL FIX APPLIED HERE ---
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
# True in prod (HTTPS), False locally (HTTP)
SESSION_COOKIE_SECURE = IS_PRODUCTION  
SESSION_COOKIE_HTTPONLY = True

# CRITICAL FIX: SameSite=None for prod cross-site, Lax for local same-site
SESSION_COOKIE_SAMESITE = 'None' if IS_PRODUCTION else 'Lax'
SESSION_COOKIE_AGE = 7 * 24 * 60 * 60 # 1 week
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_SAVE_EVERY_REQUEST = True

# NEW FIX: Only set a specific domain in production. 
# In debug mode (localhost), we leave the domain unset, letting the browser default to 
# the current domain/IP (127.0.0.1 or localhost), which is usually safer.
if IS_PRODUCTION:
    # Explicitly set the domain the session cookie is valid for in production (Render domain)
    SESSION_COOKIE_DOMAIN = os.environ.get('RENDER_EXTERNAL_HOSTNAME', '.legacyprime.onrender.com') 
else:
    # IMPORTANT: Setting this to None/False tells Django not to include the Domain attribute, 
    # which is ideal for localhost.
    SESSION_COOKIE_DOMAIN = None 


# --- CSRF SETTINGS ---
# CRITICAL FIX: Cookies must be SameSite=None and Secure=True for cross-site (Vercel <-> Render)
CSRF_COOKIE_SAMESITE = 'None' if IS_PRODUCTION else 'Lax'
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SECURE = IS_PRODUCTION  # True in prod (HTTPS), False locally (HTTP)
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'https://legacyprime.onrender.com',
    'https://legacyprime.vercel.app',
    # Add explicit Vercel frontend origin used by production frontend
    VERCEL_FRONTEND_ORIGIN,
]
CSRF_USE_SESSIONS = False


# --- TEMPLATES, WSGI, STATIC, MEDIA, ETC. (Standard Django) ---
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

# --- DATABASE CONFIG ---
DATABASE_URL = os.environ.get('DATABASE_URL', '')
if DATABASE_URL:
    DATABASES = {'default': dj_database_url.config(default=DATABASE_URL, conn_max_age=600)}
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# --- PASSWORD VALIDATORS ---
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# --- GENERAL SETTINGS ---
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# --- STATIC & MEDIA ---
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- REST FRAMEWORK ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ['rest_framework.authentication.SessionAuthentication'],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
}

# --- EMAIL SETTINGS (SendGrid) ---
EMAIL_BACKEND = os.environ.get(
    'EMAIL_BACKEND',
    'legacyprime.sendgrid_backend.SendGridEmailBackend'
)
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', 'apikey')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', '')
EMAIL_HOST_PASSWORD = os.environ.get('SENDGRID_API_KEY', '') 
EMAIL_DEBUG = DEBUG
PROJECT_NAME = 'LegacyPrime'

# --- LOGGING CONFIGURATION ---
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
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
        'accounts': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
