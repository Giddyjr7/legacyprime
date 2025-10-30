from django.db import models
from django.conf import settings


class WithdrawalAccount(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='withdrawal_accounts')
    label = models.CharField(max_length=100, blank=True)
    account_details = models.TextField(blank=True)  # e.g., address or account JSON
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.label or self.account_details[:20]}"