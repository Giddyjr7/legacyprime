from django.urls import path
from .views import (
    CreateDepositView,
    CreateWithdrawalView,
    ListTransactionsView,
    DashboardSummaryView,
    DashboardPerformanceView,
)

urlpatterns = [
    path('deposit/', CreateDepositView.as_view(), name='deposit'),
    path('withdraw/', CreateWithdrawalView.as_view(), name='withdraw'),
    path('', ListTransactionsView.as_view(), name='transactions'),
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard_summary'),
    path('dashboard/performance/', DashboardPerformanceView.as_view(), name='dashboard_performance'),
]
