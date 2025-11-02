import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
# REMOVE: from notifications.routing import websocket_urlpatterns

# 1. Set the Django settings environment variable first
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'legacyprime.settings') 

# 2. Get the base ASGI application (This initializes the Django App Registry)
django_asgi_app = get_asgi_application()

# 3. Import your local routing file ONLY NOW, after the apps are loaded.
#    This import should ideally be placed after os.environ.setdefault and get_asgi_application().
from notifications.routing import websocket_urlpatterns 

application = ProtocolTypeRouter({
    "http": django_asgi_app,  # Use the initialized app variable here
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})