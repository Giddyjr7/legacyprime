from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import DepositSerializer, WithdrawalSerializer
from .models import Deposit, Withdrawal
from django.db import models
from django.shortcuts import get_object_or_404
from itertools import chain
from operator import attrgetter
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.authentication import JWTAuthentication  # ADD THIS IMPORT

class CreateDepositView(APIView):
    authentication_classes = [JWTAuthentication]  # ADD THIS LINE
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        data = request.data.copy()
        # assign authenticated user
        serializer = DepositSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreateWithdrawalView(APIView):
    authentication_classes = [JWTAuthentication]  # ADD THIS LINE
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        data = request.data.copy()
        serializer = WithdrawalSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ListTransactionsView(APIView):
    authentication_classes = [JWTAuthentication]  # ADD THIS LINE
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        # list transactions for authenticated user, support filters
        t_type = request.query_params.get('type')  # deposit|withdrawal|all
        status_filter = request.query_params.get('status')
        deposits = Deposit.objects.filter(user=request.user)
        withdrawals = Withdrawal.objects.filter(user=request.user)
        if status_filter:
            deposits = deposits.filter(status=status_filter)
            withdrawals = withdrawals.filter(status=status_filter)
        deposits = deposits.order_by('-created_at')
        withdrawals = withdrawals.order_by('-created_at')
        d_serializer = DepositSerializer(deposits, many=True, context={'request': request})
        w_serializer = WithdrawalSerializer(withdrawals, many=True, context={'request': request})
        if t_type == 'deposit':
            return Response({'deposits': d_serializer.data})
        if t_type == 'withdrawal':
            return Response({'withdrawals': w_serializer.data})
        return Response({'deposits': d_serializer.data, 'withdrawals': w_serializer.data})


class DashboardSummaryView(APIView):
    authentication_classes = [JWTAuthentication]  # ADD THIS LINE
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        # Approved deposits/withdrawals
        approved_deposits = Deposit.objects.filter(user=request.user, status='approved')
        approved_withdrawals = Withdrawal.objects.filter(user=request.user, status='approved')
        total_deposits = approved_deposits.aggregate(total=models.Sum('amount'))['total'] or 0
        total_withdrawals = approved_withdrawals.aggregate(total=models.Sum('amount'))['total'] or 0
        balance = total_deposits - total_withdrawals
        return Response({
            'total_balance': balance,
            'total_deposits': total_deposits,
            'total_withdrawals': total_withdrawals,
        })


class TransactionPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class TransactionHistoryView(APIView):
    authentication_classes = [JWTAuthentication]  # ADD THIS LINE
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = TransactionPagination

    def get(self, request):
        # Get all transactions for the user
        deposits = Deposit.objects.filter(user=request.user)
        withdrawals = Withdrawal.objects.filter(user=request.user)

        # Apply filters if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            deposits = deposits.filter(status=status_filter)
            withdrawals = withdrawals.filter(status=status_filter)

        # Convert querysets to lists and add transaction type
        deposit_list = [{
            'id': d.id,
            'amount': d.amount,
            'type': 'DEPOSIT',
            'status': d.status,
            'date': d.created_at,
            'method': d.method,
            'proof_image': d.proof_image.url if d.proof_image else None
        } for d in deposits]

        withdrawal_list = [{
            'id': w.id,
            'amount': w.amount,
            'type': 'WITHDRAWAL',
            'status': w.status,
            'date': w.created_at,
            'withdrawal_address': w.withdrawal_address
        } for w in withdrawals]

        # Combine and sort by date
        all_transactions = deposit_list + withdrawal_list
        all_transactions.sort(key=lambda x: x['date'], reverse=True)

        # Apply pagination
        paginator = self.pagination_class()
        paginated_transactions = paginator.paginate_queryset(all_transactions, request)

        return paginator.get_paginated_response(paginated_transactions)

class DashboardPerformanceView(APIView):
    authentication_classes = [JWTAuthentication]  # ADD THIS LINE
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        # return simple time-series per day for last 30 days
        from django.utils import timezone
        from datetime import timedelta

        end = timezone.now()
        start = end - timedelta(days=30)
        deposits = Deposit.objects.filter(user=request.user, status='approved', created_at__gte=start)
        withdrawals = Withdrawal.objects.filter(user=request.user, status='approved', created_at__gte=start)

        # aggregate per day
        from django.db.models.functions import TruncDate
        d_by_day = deposits.annotate(day=TruncDate('created_at')).values('day').annotate(total=models.Sum('amount')).order_by('day')
        w_by_day = withdrawals.annotate(day=TruncDate('created_at')).values('day').annotate(total=models.Sum('amount')).order_by('day')

        return Response({
            'deposits': list(d_by_day),
            'withdrawals': list(w_by_day),
        })