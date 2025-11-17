from django.contrib import admin
from .models import WithdrawalAccount, Wallet, SystemSettings


@admin.register(WithdrawalAccount)
class WithdrawalAccountAdmin(admin.ModelAdmin):
    list_display = ('user', 'label', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'label')
    readonly_fields = ('created_at',)


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'balance', 'last_updated')
    list_filter = ('last_updated',)
    search_fields = ('user__email',)
    readonly_fields = ('user', 'last_updated')


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    list_display = ('deposit_wallet_address', 'updated_at')
    readonly_fields = ('updated_at',)
    fields = ('deposit_wallet_address', 'updated_at')

    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of system settings"""
        return False

    def has_add_permission(self, request):
        """Allow adding only if no settings instance exists (so initial setup is possible)."""
        from .models import SystemSettings as _SystemSettings
        return not _SystemSettings.objects.exists()

    def changelist_view(self, request, extra_context=None):
        """Redirect the changelist to the change view for the singleton instance if it exists."""
        from django.shortcuts import redirect
        from django.urls import reverse
        from .models import SystemSettings as _SystemSettings

        obj = _SystemSettings.objects.first()
        if obj:
            return redirect(reverse('admin:wallet_systemsettings_change', args=(obj.id,)))
        return super().changelist_view(request, extra_context=extra_context)
