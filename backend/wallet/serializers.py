from rest_framework import serializers
from .models import WithdrawalAccount, SystemSettings, WalletAddress


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


class WalletAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletAddress
        fields = ('id', 'method_name', 'wallet_address', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')
