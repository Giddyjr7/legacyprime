from django.contrib import admin
from .models import User, PendingRegistration, OTP

admin.site.register(User)
admin.site.register(PendingRegistration)
admin.site.register(OTP)