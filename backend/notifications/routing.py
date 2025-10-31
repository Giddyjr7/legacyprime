from django.urls import path
from . import consumers

# Use `path` which matches the typical Channels examples and avoids
# potential regex mismatches when the incoming scope path includes
# leading/trailing slashes. This will match `/ws/notifications/`.
websocket_urlpatterns = [
    path('ws/notifications/', consumers.UserNotificationConsumer.as_asgi()),
]