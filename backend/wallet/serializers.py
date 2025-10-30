from rest_framework import serializers
from .models import WithdrawalAccount


class WithdrawalAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = WithdrawalAccount
        fields = ('id', 'label', 'account_details', 'created_at')
        read_only_fields = ('created_at',)