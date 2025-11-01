from django.db import models
from django.conf import settings
import string
import random
from django.utils import timezone
from django.db.models import Max


def generate_reference(model_instance):
    """Generate a unique transaction reference number"""
    year = timezone.now().strftime('%Y')
    
    # Try up to 100 times to generate a unique reference
    for _ in range(100):
        # Generate 6 random characters (letters and numbers)
        chars = string.ascii_uppercase + string.digits
        random_str = ''.join(random.choices(chars, k=6))
        reference = f"TXN-{year}-{random_str}"
        
        # Check if this reference already exists
        if not model_instance.__class__.objects.filter(reference=reference).exists():
            return reference
    
    # If we couldn't generate a unique reference after 100 tries,
    # create one based on the current timestamp and a counter
    timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
    last_id = model_instance.__class__.objects.aggregate(Max('id'))['id__max'] or 0
    return f"TXN-{year}-{timestamp[-6:]}-{last_id + 1}"


class Deposit(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='deposits')
    reference = models.CharField(max_length=30, unique=True, null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=64, blank=True)
    proof_image = models.ImageField(upload_to='proofs/', null=True, blank=True)
    status = models.CharField(max_length=32, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = generate_reference(self)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Deposit {self.id} - {self.amount} - {self.status}"


class Withdrawal(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='withdrawals')
    reference = models.CharField(max_length=30, unique=True, null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    withdrawal_address = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=32, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = generate_reference(self)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Withdrawal {self.id} - {self.amount} - {self.status}"
