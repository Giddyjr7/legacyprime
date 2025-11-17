from django.core.management.base import BaseCommand
from wallet.models import SystemSettings


class Command(BaseCommand):
    help = 'Initialize system settings with the wallet address'

    def add_arguments(self, parser):
        parser.add_argument(
            '--wallet-address',
            type=str,
            default='bc1qcl84vkhs9aur0qcf02n8xfwk6pe95zrtq7f05w',
            help='The deposit wallet address to set',
        )

    def handle(self, *args, **options):
        wallet_address = options['wallet_address']
        
        settings, created = SystemSettings.objects.get_or_create(
            id=1,
            defaults={'deposit_wallet_address': wallet_address}
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ System settings created with wallet address: {wallet_address}'
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    f'System settings already exist with wallet address: {settings.deposit_wallet_address}'
                )
            )
