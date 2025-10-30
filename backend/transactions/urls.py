from django.urls import path
from .views import (
    CreateDepositView,
    CreateWithdrawalView,
    ListTransactionsView,
    DashboardSummaryView,
    DashboardPerformanceView,
    TransactionHistoryView,
)

urlpatterns = [
    path('deposit/', CreateDepositView.as_view(), name='deposit'),
    path('withdraw/', CreateWithdrawalView.as_view(), name='withdraw'),
    path('', ListTransactionsView.as_view(), name='transactions'),
    path('history/', TransactionHistoryView.as_view(), name='transaction_history'),
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard_summary'),
    path('dashboard/performance/', DashboardPerformanceView.as_view(), name='dashboard_performance'),
]
