from rest_framework import serializers
from .models import WithdrawalAccount, SystemSettings


class WithdrawalAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = WithdrawalAccount
        fields = ('id', 'label', 'account_details', 'created_at')
        read_only_fields = ('created_at',)


class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = ('deposit_wallet_address', 'updated_at')
        read_only_fields = ('updated_at',)
