# Withdrawal Balance Validation Implementation

## Overview
Implemented robust withdrawal balance validation on both **client-side (React)** and **server-side (Django)** to prevent users from submitting withdrawal requests exceeding their available account balance.

## Problem Solved
Previously, users could submit withdrawal requests for amounts greater than their current account balance. This placed unnecessary administrative burden on approvers to reject invalid transactions.

## Solution Implemented

### 1. Frontend Changes (React - `/src/pages/dashboard/Withdraw.tsx`)

#### A. State Management for Balance
```typescript
const [availableBalance, setAvailableBalance] = useState<number>(0);
const [balanceLoading, setBalanceLoading] = useState(true);
```
- `availableBalance`: Stores the user's current account balance
- `balanceLoading`: Tracks loading state while fetching balance from API

#### B. Fetch Balance on Component Mount
```typescript
useEffect(() => {
  const fetchBalance = async () => {
    try {
      setBalanceLoading(true);
      const response = await api.get(ENDPOINTS.DASHBOARD_SUMMARY);
      setAvailableBalance(response.data.total_balance || 0);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setAvailableBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  };

  if (isAuthenticated) {
    fetchBalance();
  }
}, [isAuthenticated]);
```
- Calls `DASHBOARD_SUMMARY` API endpoint to get real-time balance
- Handles errors gracefully by defaulting to 0
- Runs only when user is authenticated

#### C. Client-Side Validation in `handleWithdraw()`
```typescript
// Check if balance is zero
if (availableBalance <= 0) {
  toast({
    title: 'Insufficient Balance',
    description: 'INSUFFICIENT BALANCE. Please deposit funds to withdraw.',
    variant: 'destructive',
  });
  return;
}

// Check if withdrawal amount exceeds available balance
if (requestedAmount > availableBalance) {
  toast({
    title: 'Insufficient Balance',
    description: 'SORRY, you cannot withdraw above the current balance you have in your wallet.',
    variant: 'destructive',
  });
  return;
}
```
- Prevents form submission with specific error messages
- Provides immediate user feedback before API call

#### D. UI Enhancements
1. **Display Available Balance**
   - Shows current balance with formatted currency display
   - Color-coded: Red if zero/negative, Green if positive
   - Displays "—" while loading

2. **Disable Button Conditionally**
   ```typescript
   disabled={
     !selectedMethod || 
     !amount || 
     !walletAddress || 
     isLoading || 
     parseFloat(amount) < 5 || 
     availableBalance <= 0 ||                    // NEW
     parseFloat(amount) > availableBalance ||     // NEW
     balanceLoading                               // NEW
   }
   ```

### 2. Backend Changes (Django - `/backend/wallet/views.py`)

#### A. Import Required Models
```python
from transactions.models import Deposit, Withdrawal as WithdrawalModel
from django.db.models import Sum
```

#### B. Calculate Current Balance
```python
# Calculate user's current balance before allowing withdrawal
approved_deposits = Deposit.objects.filter(
  user=request.user, 
  status='approved'
).aggregate(total=Sum('amount'))['total'] or 0

approved_withdrawals = WithdrawalModel.objects.filter(
  user=request.user, 
  status='approved'
).aggregate(total=Sum('amount'))['total'] or 0

current_balance = approved_deposits - approved_withdrawals
```
- Sums all approved deposits
- Subtracts all approved withdrawals
- Results in accurate current balance

#### C. Validate Balance Before Creating Withdrawal
```python
# Validate withdrawal amount against current balance
if current_balance <= 0:
    return Response(
        {"error": "INSUFFICIENT BALANCE. Please deposit funds to withdraw."},
        status=status.HTTP_400_BAD_REQUEST
    )

if amount > current_balance:
    return Response(
        {"error": "SORRY, you cannot withdraw above the current balance you have in your wallet."},
        status=status.HTTP_400_BAD_REQUEST
    )
```
- Returns **400 Bad Request** with appropriate error message
- Prevents withdrawal record creation if validation fails
- Messages match frontend error messages

#### D. Logging for Debugging
```python
print(f"🔍 User {request.user.email} balance check: approved_deposits={approved_deposits}, approved_withdrawals={approved_withdrawals}, current_balance={current_balance}")
```

## Error Messages

### Client-Side and Server-Side Match
Both return identical error messages for consistency:

1. **Zero Balance Scenario:**
   ```
   "INSUFFICIENT BALANCE. Please deposit funds to withdraw."
   ```
   - Displayed when user has $0 balance
   - Prevents withdrawal attempts entirely

2. **Amount Exceeds Balance Scenario:**
   ```
   "SORRY, you cannot withdraw above the current balance you have in your wallet."
   ```
   - Displayed when requested amount > available balance
   - Provides specific guidance to user

## Validation Flow

### User Submits Withdrawal Request
```
1. Form validation (method, amount, address)
2. Amount >= $5 validation
3. CLIENT-SIDE: Fetch balance from API
4. CLIENT-SIDE: Check if balance > 0
5. CLIENT-SIDE: Check if amount <= balance
6. If all pass → Send to backend
   If any fail → Show error toast, prevent submission
7. SERVER-SIDE: Recalculate balance from database
8. SERVER-SIDE: Verify amount <= balance
9. If valid → Create withdrawal record, return 201
   If invalid → Return 400 with error message
```

## Benefits

✅ **Immediate User Feedback** - Client-side validation provides instant response  
✅ **Security-Critical** - Server-side validation prevents tampering  
✅ **Reduces Admin Work** - Prevents invalid withdrawal requests from cluttering system  
✅ **Consistent Error Messages** - Frontend and backend communicate same messages  
✅ **Real-Time Balance Display** - Users see current balance before submitting  
✅ **Proper HTTP Status Codes** - 400 Bad Request for validation failures  
✅ **Comprehensive Logging** - Server logs balance calculations for debugging  

## Test Scenarios

### Scenario 1: User with $0 Balance
- Expected: "INSUFFICIENT BALANCE. Please deposit funds to withdraw." error
- Button: Disabled
- Result: ✅ Cannot submit withdrawal

### Scenario 2: User with $100 Balance, Requests $150
- Expected: "SORRY, you cannot withdraw above the current balance..." error
- Button: Disabled after showing error
- Result: ✅ Cannot submit withdrawal

### Scenario 3: User with $100 Balance, Requests $50
- Expected: Form submits successfully
- Button: Enabled
- Result: ✅ Withdrawal created as pending

### Scenario 4: Client-Side Bypass Attempt
- If client validation bypassed, server validation catches it
- Server returns 400 with error message
- Result: ✅ Double protection working

## Files Modified

1. **`src/pages/dashboard/Withdraw.tsx`**
   - Added balance state management
   - Added balance fetching useEffect
   - Added balance validation in handleWithdraw()
   - Updated UI with balance display
   - Updated button disabled state

2. **`backend/wallet/views.py`**
   - Updated WithdrawalRequestView.post()
   - Added balance calculation logic
   - Added validation before withdrawal creation
   - Added logging for debugging
