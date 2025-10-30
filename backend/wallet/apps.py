from django.apps import AppConfig

class WalletConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'wallet'
    verbose_name = 'LegacyPrime Wallet'

    def ready(self):
        import wallet.signals  # Import signals