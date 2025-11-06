import os
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# --- CORE SETTINGS ---
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("DJANGO_SECRET_KEY not set in environment")

DEBUG = os.environ.get('DJANGO_DEBUG', 'False').lower() == 'true'
IS_PRODUCTION = not DEBUG

# --- HOSTS ---
RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME', 'legacyprime.onrender.com')
VERCEL_FRONTEND_ORIGIN = os.environ.get('VERCEL_FRONTEND_ORIGIN', 'https://legacyprime.vercel.app')
RENDER_DOMAIN = RENDER_EXTERNAL_HOSTNAME.replace("https://", "").replace("http://", "")
VERCEL_DOMAIN = VERCEL_FRONTEND_ORIGIN.replace("https://", "").replace("http://", "")

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    RENDER_DOMAIN,
    VERCEL_DOMAIN,
]

extra_hosts = os.environ.get('DJANGO_ALLOWED_HOSTS', '').split(',')
ALLOWED_HOSTS += [h.strip() for h in extra_hosts if h.strip()]
ALLOWED_HOSTS = list(dict.fromkeys(ALLOWED_HOSTS))  # Remove duplicates

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

# --- CHANNELS ---
CHANNEL_LAYERS = {'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'}}

# --- USER MODEL ---
AUTH_USER_MODEL = 'accounts.User'

# --- CORS ---
CORS_ALLOW_CREDENTIALS = True
ENV_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')
CORS_ALLOWED_ORIGINS = list({
    *[
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        f'https://{RENDER_DOMAIN}',
        f'https://{VERCEL_DOMAIN}',
    ],
    *[o.strip() for o in ENV_ORIGINS if o.strip()],
})
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
CORS_ALLOW_METHODS = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']

# --- SESSION SETTINGS ---
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_NAME = os.environ.get('SESSION_COOKIE_NAME', 'sessionid')
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_AGE = 7 * 24 * 60 * 60  # 1 week
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_SAVE_EVERY_REQUEST = True

if IS_PRODUCTION:
    SESSION_COOKIE_SAMESITE = 'None'
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_DOMAIN = RENDER_DOMAIN
else:
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_DOMAIN = None

# --- CSRF ---
CSRF_COOKIE_HTTPONLY = False
CSRF_USE_SESSIONS = False
CSRF_COOKIE_SAMESITE = 'None' if IS_PRODUCTION else 'Lax'
CSRF_COOKIE_SECURE = IS_PRODUCTION
CSRF_TRUSTED_ORIGINS = [
    f'https://{VERCEL_DOMAIN}',
    f'https://{RENDER_DOMAIN}',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
if IS_PRODUCTION:
    CSRF_COOKIE_DOMAIN = RENDER_DOMAIN

# --- STATIC & MEDIA ---
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# --- GENERAL ---
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- REST FRAMEWORK ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ['rest_framework.authentication.SessionAuthentication'],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
}

# --- EMAIL SETTINGS (SENDGRID) ---
EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'legacyprime.sendgrid_backend.SendGridEmailBackend')
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', 'apikey')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', '')
EMAIL_HOST_PASSWORD = os.environ.get('SENDGRID_API_KEY', '')
EMAIL_DEBUG = DEBUG


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
