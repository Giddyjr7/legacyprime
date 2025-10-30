from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.db import transaction
from transactions.models import Deposit, Withdrawal
from .models import Wallet

@receiver(pre_save, sender=Deposit)
def handle_deposit_status_change(sender, instance, **kwargs):
    """Handle deposit approval and balance updates"""
    try:
        if instance.pk:  # If this is an update
            old_instance = Deposit.objects.get(pk=instance.pk)
            # Only proceed if status is changing to approved
            if old_instance.status != 'approved' and instance.status == 'approved':
                wallet, _ = Wallet.objects.get_or_create(user=instance.user)
                with transaction.atomic():
                    wallet.update_balance(instance.amount, 'add')
    except Deposit.DoesNotExist:
        pass  # New deposit, no action needed

@receiver(pre_save, sender=Withdrawal)
def handle_withdrawal_status_change(sender, instance, **kwargs):
    """Handle withdrawal approval and balance updates"""
    try:
        if instance.pk:  # If this is an update
            old_instance = Withdrawal.objects.get(pk=instance.pk)
            # Only proceed if status is changing to approved
            if old_instance.status != 'approved' and instance.status == 'approved':
                wallet, _ = Wallet.objects.get_or_create(user=instance.user)
                with transaction.atomic():
                    try:
                        wallet.update_balance(instance.amount, 'subtract')
                    except ValueError:
                        # Reset status if insufficient balance
                        instance.status = 'rejected'
                        instance.save()
    except Withdrawal.DoesNotExist:
        pass  # New withdrawal, no action needed

@receiver(post_save, sender=Deposit)
@receiver(post_save, sender=Withdrawal)
def create_wallet_if_needed(sender, instance, created, **kwargs):
    """Ensure user has a wallet when they make their first transaction"""
    if created:  # Only for new transactions
        Wallet.objects.get_or_create(user=instance.user)