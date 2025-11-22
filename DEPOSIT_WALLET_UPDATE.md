# Deposit System Wallet Address Update Guide

## Overview
The deposit system has been updated to support **per-method wallet addresses** instead of a single global wallet address. Each deposit method (Bitcoin, ETHEREUM, USDT BEP20, USDT TRC20) now has its own unique wallet address configured individually through the Django admin panel.

## Changes Made

### 1. Backend Model Changes

#### New Model: `WalletAddress`
**File:** `backend/wallet/models.py`

```python
class WalletAddress(models.Model):
    """
    Stores wallet addresses per deposit method (e.g., Bitcoin, USDT-TRC20)
    """
    method_name = models.CharField(max_length=100, unique=True)
    wallet_address = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Wallet Address"
        verbose_name_plural = "Wallet Addresses"

    def __str__(self):
        return f"{self.method_name} -> {self.wallet_address}"
```

**Fields:**
- `method_name`: Unique identifier for the payment method (e.g., "BITCOIN", "ETHEREUM", "USDT BEP20", "USDT TRC20")
- `wallet_address`: The wallet address where deposits should be sent for this method
- `created_at`: Auto-generated timestamp
- `updated_at`: Auto-updated timestamp

#### SystemSettings Model
**File:** `backend/wallet/models.py`

No changes made to the structure. The `SystemSettings.deposit_wallet_address` field is now **deprecated** but kept for backward compatibility. Frontend and API calls no longer use it.

### 2. Admin Panel Updates

**File:** `backend/wallet/admin.py`

Added `WalletAddressAdmin` class:

```python
@admin.register(WalletAddress)
class WalletAddressAdmin(admin.ModelAdmin):
    list_display = ('method_name', 'wallet_address', 'updated_at')
    search_fields = ('method_name', 'wallet_address')
    readonly_fields = ('created_at', 'updated_at')
    fields = ('method_name', 'wallet_address', 'created_at', 'updated_at')
```

**Admin Features:**
- **Create:** Add new wallet addresses for each deposit method
- **Edit:** Update existing wallet addresses (method_name is unique, so updating an address requires editing the record)
- **Delete:** Remove wallet addresses for deprecated methods
- **List View:** Shows method name, wallet address, and last updated timestamp
- **Search:** Search by method name or wallet address

### 3. Serializers

**File:** `backend/wallet/serializers.py`

Added `WalletAddressSerializer`:

```python
class WalletAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletAddress
        fields = ('id', 'method_name', 'wallet_address', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')
```

### 4. API Endpoints

**File:** `backend/wallet/urls.py` and `backend/wallet/views.py`

#### New Endpoint: GET `/api/wallet/address/?method=<method_name>`

**View:** `WalletAddressView`

**Access:** Public (no authentication required)

**Query Parameters:**
- `method` (required): The deposit method name (e.g., "BITCOIN", "USDT-TRC20")

**Response (200 OK):**
```json
{
  "id": 1,
  "method_name": "BITCOIN",
  "wallet_address": "1A1z7agoat3xFZ88MP357yvDNy3e7c3DZ9",
  "created_at": "2025-11-22T10:00:00Z",
  "updated_at": "2025-11-22T10:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Missing `method` query parameter
- `404 Not Found`: Wallet address not configured for the requested method

**Example Usage:**
```bash
curl "http://localhost:8000/api/wallet/address/?method=BITCOIN"
```

### 5. Frontend Changes

**File:** `src/config/api.ts`

Added new endpoint:
```typescript
WALLET_ADDRESS_BY_METHOD: (method: string) => joinUrl(API_BASE_URL, `wallet/address/?method=${encodeURIComponent(method)}`),
```

**File:** `src/pages/dashboard/ConfirmDeposit.tsx`

Updated the `useEffect` hook to fetch wallet address by the selected method instead of the global SystemSettings:

```typescript
useEffect(() => {
  const fetchWalletAddress = async () => {
    try {
      setIsFetching(true);
      const method = (location.state || {}).method || '';
      if (!method) {
        toast({
          title: 'Error',
          description: 'No payment method specified.',
          variant: 'destructive',
        });
        return;
      }
      // Fetch wallet address specific to the selected method
      const response = await api.get(ENDPOINTS.WALLET_ADDRESS_BY_METHOD(method));
      setWalletAddress(response.data.wallet_address);
    } catch (err) {
      console.error('Failed to fetch wallet address:', err);
      toast({
        title: 'Error',
        description: 'Failed to load wallet address. Please refresh the page.',
        variant: 'destructive',
      });
    } finally {
      setIsFetching(false);
    }
  };

  fetchWalletAddress();
}, [location.state, toast]);
```

### 6. Migrations

**File:** `backend/wallet/migrations/0003_walletaddress.py`

A new migration has been created to add the `WalletAddress` model to the database.

## Setup Instructions

### For Developers

#### 1. Apply Database Migrations

```bash
cd backend
python manage.py migrate wallet
```

This will create the `wallet_walletaddress` table in the database.

#### 2. Add Wallet Addresses in Admin

1. Navigate to Django admin: `http://localhost:8000/admin`
2. Log in with your admin credentials
3. Under "Wallet" section, click **"Wallet Addresses"**
4. Click **"Add Wallet Address"**
5. Enter:
   - **Method Name:** `BITCOIN` (or your method name exactly)
   - **Wallet Address:** Your actual wallet address for this method
6. Click **"Save"**

Repeat for each deposit method:
- `BITCOIN`
- `ETHEREUM`
- `USDT BEP20`
- `USDT TRC20`

#### 3. Test the Flow

1. Go to the frontend and navigate to **Deposit**
2. Select a payment method (e.g., **BITCOIN**)
3. Enter an amount
4. Click **Confirm Deposit**
5. Verify that the correct wallet address appears for the selected method

### For Deployment

#### 1. Database Migration

Run migrations on the production database:

```bash
python manage.py migrate wallet
```

#### 2. Populate Wallet Addresses

Use Django admin or create a data fixture with the production wallet addresses:

**Example Admin UI Steps:**
- SSH into the production server
- Access the Django admin panel
- Add wallet addresses for each method with the production addresses

**Alternative: Use a Django Management Command**

Create a management command to seed data (optional):

```python
# backend/wallet/management/commands/seed_wallets.py
from django.core.management.base import BaseCommand
from wallet.models import WalletAddress

class Command(BaseCommand):
    help = 'Seed wallet addresses for deposit methods'

    def handle(self, *args, **options):
        wallets = [
            {'method_name': 'BITCOIN', 'wallet_address': 'YOUR_BITCOIN_ADDRESS'},
            {'method_name': 'ETHEREUM', 'wallet_address': 'YOUR_ETH_ADDRESS'},
            {'method_name': 'USDT BEP20', 'wallet_address': 'YOUR_USDT_BEP20_ADDRESS'},
            {'method_name': 'USDT TRC20', 'wallet_address': 'YOUR_USDT_TRC20_ADDRESS'},
        ]
        for wallet in wallets:
            obj, created = WalletAddress.objects.get_or_create(
                method_name=wallet['method_name'],
                defaults={'wallet_address': wallet['wallet_address']}
            )
            if created:
                self.stdout.write(f"✓ Created {wallet['method_name']}")
            else:
                self.stdout.write(f"~ {wallet['method_name']} already exists")
```

Run with:
```bash
python manage.py seed_wallets
```

## Flow Summary

### User Deposit Flow

1. **Deposit Page**: User selects payment method and enters amount
2. **Navigate**: Click "Confirm Deposit"
3. **Confirm Page**: 
   - Frontend fetches wallet address via `GET /api/wallet/address/?method=<selected_method>`
   - Backend returns wallet address for that method
   - Frontend displays the method-specific wallet address
4. **Payment**: User sends payment to the displayed wallet address
5. **Proof Upload**: User uploads payment proof
6. **Submit**: Deposit request is created with `method`, `amount`, and `proof_image`

### Admin Flow

1. **Admin Panel**: Go to Django admin → Wallet Addresses
2. **CRUD Operations**:
   - **Create**: Add wallet addresses for each deposit method
   - **Read**: View all configured wallet addresses and their methods
   - **Update**: Edit wallet addresses when needed
   - **Delete**: Remove addresses for deprecated methods

## Key Differences from Previous System

| Aspect | Before | After |
|--------|--------|-------|
| Wallet Address Storage | Single global address in SystemSettings | Per-method addresses in WalletAddress model |
| Admin Management | Edit SystemSettings singleton | CRUD in WalletAddressAdmin |
| Frontend Fetch | `GET /api/wallet/settings/` (returns all settings) | `GET /api/wallet/address/?method=<method>` (returns specific address) |
| Method Handling | Stored in Deposit but address ignored | Stored in Deposit and matched with WalletAddress |
| Flexibility | One address for all methods | Independent address per method |
| Scalability | Not suitable for multi-method | Supports unlimited methods |

## Backward Compatibility

- **SystemSettings Model**: Still exists but `deposit_wallet_address` is now deprecated (no longer used)
- **Existing Deposits**: All existing deposits continue to work as the `method` field remains unchanged
- **Database**: No data loss; old field preserved for potential rollback

## Testing Checklist

- [ ] Migration applied successfully
- [ ] Wallet addresses added in admin for each method
- [ ] Admin CRUD operations work (Create, Read, Update, Delete)
- [ ] API endpoint returns correct address for each method
- [ ] Frontend shows correct wallet address when method is selected
- [ ] Deposit submission records method correctly
- [ ] Deposit confirmation displays the right wallet address
- [ ] Error handling works (missing method, not found, etc.)

## Troubleshooting

### "Wallet address not found for the provided method"

**Cause:** No wallet address configured for the selected method

**Solution:** 
1. Go to Django admin → Wallet Addresses
2. Ensure the method name exactly matches the frontend method name (case-sensitive)
3. Add the missing wallet address

### Frontend shows empty wallet address

**Cause:** API endpoint not found or method parameter mismatch

**Solution:**
1. Check browser console for API errors
2. Verify the method name matches exactly (case-sensitive)
3. Ensure migrations have been applied: `python manage.py migrate wallet`

### Cannot edit method_name in admin

**Cause:** `method_name` field is unique and enforces uniqueness

**Solution:**
- Delete the wallet address and create a new one with the correct name
- Or use Django shell to update it programmatically

## Files Modified

1. **Backend:**
   - `backend/wallet/models.py` - Added WalletAddress model
   - `backend/wallet/admin.py` - Added WalletAddressAdmin
   - `backend/wallet/serializers.py` - Added WalletAddressSerializer
   - `backend/wallet/views.py` - Added WalletAddressView
   - `backend/wallet/urls.py` - Added wallet address route
   - `backend/wallet/migrations/0003_walletaddress.py` - New migration

2. **Frontend:**
   - `src/config/api.ts` - Added WALLET_ADDRESS_BY_METHOD endpoint
   - `src/pages/dashboard/ConfirmDeposit.tsx` - Updated to fetch per-method wallet address

## Next Steps (Optional Enhancements)

1. **Add wallet validation**: Validate wallet addresses on save (e.g., checksum validation for Bitcoin/Ethereum)
2. **Add labels**: Add a `label` field to describe each wallet address
3. **Add status**: Add an `is_active` boolean to enable/disable methods without deleting
4. **Audit logging**: Track who changed wallet addresses and when
5. **Notifications**: Alert admins when wallet addresses are updated

---

**Implementation Date:** November 22, 2025
**Status:** ✅ Complete and Ready for Testing
