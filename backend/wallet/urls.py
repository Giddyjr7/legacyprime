from django.urls import path
from .views import (
    WithdrawalAccountListCreateView,
    WithdrawalAccountDetailView,
    DepositRequestView,
    ConfirmDepositView,
    WithdrawalRequestView,
    SystemSettingsView,
)

urlpatterns = [
    path('withdrawal-accounts/', WithdrawalAccountListCreateView.as_view(), name='withdrawal_accounts'),
    path('withdrawal-accounts/<int:pk>/', WithdrawalAccountDetailView.as_view(), name='withdrawal_account_detail'),
    # Financial flow endpoints
    path('deposit/request/', DepositRequestView.as_view(), name='deposit_request'),
    path('deposit/<int:pk>/confirm/', ConfirmDepositView.as_view(), name='deposit_confirm'),
    path('withdraw/', WithdrawalRequestView.as_view(), name='withdraw_request'),
    # System settings endpoint
    path('settings/', SystemSettingsView.as_view(), name='system_settings'),
]


