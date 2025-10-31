from django.db.models.signals import post_save
from django.dispatch import receiver
from transactions.models import Deposit, Withdrawal
from notifications.utils import send_notification_to_user, send_transaction_update, send_balance_update

@receiver(post_save, sender=Deposit)
def deposit_post_save(sender, instance, created, **kwargs):
    if not created and instance.status in ['approved', 'rejected']:
        transaction_type = 'deposit'
        # Send notification to user
        send_notification_to_user(
            instance.user.id,
            f"Your deposit of {instance.amount} has been {instance.status}!",
            "success" if instance.status == 'approved' else "error"
        )
        
        # Send detailed transaction update
        send_transaction_update(
            instance.user.id,
            f"{transaction_type}_{instance.status}",
            {
                "type": transaction_type,
                "transaction": {
                    "id": instance.id,
                    "type": transaction_type,
                    "amount": str(instance.amount),
                    "status": instance.status,
                    "created_at": instance.created_at.isoformat(),
                    "updated_at": instance.updated_at.isoformat()
                }
            }
        )
        
        # Send balance update if approved
        if instance.status == 'approved':
            send_balance_update(instance.user.id, str(instance.user.wallet.balance))

@receiver(post_save, sender=Withdrawal)
def withdrawal_post_save(sender, instance, created, **kwargs):
    if not created and instance.status in ['approved', 'rejected']:
        transaction_type = 'withdrawal'
        # Send notification to user
        send_notification_to_user(
            instance.user.id,
            f"Your withdrawal of {instance.amount} has been {instance.status}!",
            "success" if instance.status == 'approved' else "error"
        )
        
        # Send detailed transaction update
        send_transaction_update(
            instance.user.id,
            f"{transaction_type}_{instance.status}",
            {
                "type": transaction_type,
                "transaction": {
                    "id": instance.id,
                    "type": transaction_type,
                    "amount": str(instance.amount),
                    "status": instance.status,
                    "created_at": instance.created_at.isoformat(),
                    "updated_at": instance.updated_at.isoformat()
                }
            }
        )
        
        # Send balance update if approved
        if instance.status == 'approved':
            send_balance_update(instance.user.id, str(instance.user.wallet.balance))