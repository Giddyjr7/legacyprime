from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from accounts.models import PendingRegistration

class Command(BaseCommand):
    help = 'Clean up expired pending registrations (older than 24 hours)'

    def handle(self, *args, **kwargs):
        # Calculate the cutoff time (24 hours ago)
        cutoff_time = timezone.now() - timedelta(hours=24)

        # Delete expired pending registrations
        deleted_count = PendingRegistration.objects.filter(
            created_at__lt=cutoff_time
        ).delete()[0]

        self.stdout.write(
            self.style.SUCCESS(f'Successfully deleted {deleted_count} expired pending registrations')
        )