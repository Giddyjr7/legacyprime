import os
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url
# from datetime import timedelta  # unused

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("No DJANGO_SECRET_KEY set in environment")

# Set DEBUG based on environment variable, defaults to False for safety
DEBUG = os.environ.get('DJANGO_DEBUG', 'False').lower() == 'true'

# Determine if we are running in a production-like environment (DEBUG is False)
IS_PRODUCTION = not DEBUG 

# --- RENDER/VERCEL ORIGINS SETUP ---
# Get external hostnames from environment or use sensible defaults
RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME', 'legacyprime.onrender.com')
VERCEL_FRONTEND_ORIGIN = os.environ.get('VERCEL_FRONTEND_ORIGIN', 'https://legacyprime-frontend.vercel.app')
VERCEL_ORIGIN_NO_PROTOCOL = VERCEL_FRONTEND_ORIGIN.replace("https://", "").replace("http://", "")
RENDER_DOMAIN_NO_PROTOCOL = RENDER_EXTERNAL_HOSTNAME.replace("https://", "").replace("http://", "")

# --- ALLOWED HOSTS ---
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    RENDER_DOMAIN_NO_PROTOCOL, # legacyprime.onrender.com
    VERCEL_ORIGIN_NO_PROTOCOL, # legacyprime-frontend.vercel.app
]

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
    # Production origins
    # Render backend (allow both http and https variants in case of odd referers)
    f'https://{RENDER_DOMAIN_NO_PROTOCOL}',
    f'http://{RENDER_DOMAIN_NO_PROTOCOL}',
    # Vercel frontend (allow both http and https variants)
    VERCEL_FRONTEND_ORIGIN,
    f'http://{VERCEL_ORIGIN_NO_PROTOCOL}',
]

ENV_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')
CORS_ALLOWED_ORIGINS = list(set(BASE_ALLOWED_ORIGINS + [o.strip() for o in ENV_ORIGINS if o.strip()]))

# CRITICAL FIX 4: Explicitly define allowed methods and headers for the CORS preflight
# This is often the missing piece causing "preflight failed" errors.
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken', # Must be explicitly allowed for the frontend to send it
    'x-requested-with',
]
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS', # Essential for the preflight request
    'PATCH',
    'POST',
    'PUT',
]

# --- MIDDLEWARE ---
MIDDLEWARE = [
    # CORS must be very high up
    'corsheaders.middleware.CorsMiddleware', 
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # Assuming this is your custom debug middleware
    'legacyprime.middleware.DebugMiddleware', 
]

# --- SESSION (COOKIE) SETTINGS ---
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
# Explicit session cookie name to avoid accidental overrides
SESSION_COOKIE_NAME = os.environ.get('SESSION_COOKIE_NAME', 'sessionid')
SESSION_COOKIE_HTTPONLY = True # Session cookie should remain HTTPOnly for security
SESSION_COOKIE_AGE = 7 * 24 * 60 * 60 # 1 week
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_SAVE_EVERY_REQUEST = True

if IS_PRODUCTION:
    # CRITICAL: Must be the string 'None' for cross-site cookies so browsers
    # set the SameSite attribute explicitly to `None` (not omitted).
    # If you set this to None (the Python None), Django omits the attribute
    # which results in browsers using default Lax behavior and blocking
    # cross-site cookies. Use the string 'None' to get SameSite=None in the
    # Set-Cookie header.
    SESSION_COOKIE_SAMESITE = 'None'
    # CRITICAL: Must be True when SameSite=None (requires HTTPS)
    SESSION_COOKIE_SECURE = True
    # CRITICAL FIX 1: Set the domain to the exact Render hostname
    SESSION_COOKIE_DOMAIN = RENDER_EXTERNAL_HOSTNAME
    # FINAL FIX: Ensure session cookie is set to the root path
    SESSION_COOKIE_PATH = '/'
else:
    # Local development settings (friendly to HTTP)
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_DOMAIN = None 


# --- CSRF SETTINGS ---
# CRITICAL FIX 2: Explicitly set CSRF_COOKIE_HTTPONLY to False
# This MUST be false so your frontend JavaScript can read the token and put it in the header.
CSRF_COOKIE_HTTPONLY = False
CSRF_USE_SESSIONS = False

if IS_PRODUCTION:
    # CRITICAL: Both cookies must have SameSite='None' for cross-site requests
    # Using string 'None' (not Python None) to ensure browser sets attribute
    CSRF_COOKIE_SAMESITE = 'None'
    SESSION_COOKIE_SAMESITE = 'None'
    # Both cookies must be Secure in production (HTTPS required)
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_SECURE = True
    # Both cookies available on all paths
    CSRF_COOKIE_PATH = '/'
    SESSION_COOKIE_PATH = '/'
    # Both cookies must have matching domains in production
    CSRF_COOKIE_DOMAIN = RENDER_EXTERNAL_HOSTNAME
    SESSION_COOKIE_DOMAIN = RENDER_EXTERNAL_HOSTNAME
    # CRITICAL FIX 3: Dynamic and robust CSRF Trusted Origins list
    CSRF_TRUSTED_ORIGINS = [
        # Trust your Vercel frontend (both HTTPS and HTTP in case of strange Referer headers)
        f'https://{VERCEL_ORIGIN_NO_PROTOCOL}',
        f'http://{VERCEL_ORIGIN_NO_PROTOCOL}',
        # Trust your own Render backend domain
        f'https://{RENDER_DOMAIN_NO_PROTOCOL}',
        f'http://{RENDER_DOMAIN_NO_PROTOCOL}',
    ]
else:
    # Local development settings (friendly to HTTP)
    CSRF_COOKIE_SAMESITE = 'Lax'
    CSRF_COOKIE_SECURE = False
    CSRF_TRUSTED_ORIGINS = [
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]

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
