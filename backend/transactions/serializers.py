from rest_framework import serializers
from .models import Deposit, Withdrawal


class DepositSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deposit
        fields = ('id', 'user', 'amount', 'method', 'proof_image', 'status', 'created_at')
        read_only_fields = ('status', 'created_at', 'user')


class WithdrawalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Withdrawal
        fields = ('id', 'user', 'amount', 'withdrawal_address', 'status', 'created_at')
        read_only_fields = ('status', 'created_at', 'user')
