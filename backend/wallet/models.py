from django.db import models
from django.conf import settings
from decimal import Decimal


class WithdrawalAccount(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='withdrawal_accounts')
    label = models.CharField(max_length=100, blank=True)
    account_details = models.TextField(blank=True)  # e.g., address or account JSON
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.label or self.account_details[:20]}"


class Wallet(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email}'s wallet - {self.balance}"

    def update_balance(self, amount: Decimal, operation: str):
        """
        Update wallet balance with proper decimal handling
        
        Args:
            amount: Decimal amount to add/subtract
            operation: 'add' for deposits, 'subtract' for withdrawals
        """
        amount = Decimal(str(amount))  # Ensure decimal
        if operation == 'add':
            self.balance += amount
        elif operation == 'subtract':
            if self.balance >= amount:  # Prevent negative balance
                self.balance -= amount
            else:
                raise ValueError("Insufficient balance")
        self.save()