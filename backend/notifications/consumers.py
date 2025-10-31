from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.middleware.csrf import CsrfViewMiddleware
from asgiref.sync import async_to_sync

User = get_user_model()

class UserNotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        # Get token from query string
        query_string = self.scope.get('query_string', b'').decode()
        params = dict(param.split('=') for param in query_string.split('&') if param)
        
        if 'token' not in params:
            await self.close()
            return
            
        # Get token and validate it's a proper CSRF token
        token = params['token']
        csrf = CsrfViewMiddleware()
        
        # If token is valid, get the associated user from the session
        if not csrf._check_token(token):
            await self.close()
            return
            
        # Get user from the session and validate
        user = self.scope.get('user', AnonymousUser())
        if not user or user.is_anonymous:
            await self.close()
            return
        
        # Join user-specific group
        self.user_group_name = f"user_{user.id}"
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'user_group_name'):
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )

    async def receive_json(self, content):
        # Handle any messages from client if needed
        pass

    async def transaction_update(self, event):
        """Handle transaction updates (deposits/withdrawals)"""
        await self.send_json({
            'type': 'transaction_update',
            'data': event['data']
        })
    
    async def balance_update(self, event):
        """Handle balance updates"""
        await self.send_json({
            'type': 'balance_update',
            'data': event['data']
        })
    
    async def notification_update(self, event):
        """Handle general notifications"""
        await self.send_json({
            'type': 'notification',
            'data': event['data']
        })