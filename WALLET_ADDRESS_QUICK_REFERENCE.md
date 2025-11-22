# Quick Reference: Deposit Wallet Address System

## 📋 Implementation Summary

### What Changed?
- ✅ Each deposit method now has its own wallet address
- ✅ Admin panel provides CRUD interface for wallet addresses
- ✅ Frontend fetches the correct wallet address per method
- ✅ Backward compatible with existing system

---

## 🚀 Quick Start

### 1. Apply Migrations
```bash
cd backend
python manage.py migrate wallet
```

### 2. Add Wallet Addresses via Admin
```
1. Go to http://localhost:8000/admin
2. Navigate to Wallet > Wallet Addresses
3. Click "Add Wallet Address"
4. Enter:
   - Method Name: BITCOIN (or your method)
   - Wallet Address: (your wallet address)
5. Save
6. Repeat for: ETHEREUM, USDT BEP20, USDT TRC20
```

### 3. Test
```
1. Deposit page → Select method → Confirm Deposit
2. Verify the correct wallet address displays
```

---

## 🔌 API Reference

### Get Wallet Address for a Method
```
GET /api/wallet/address/?method=BITCOIN
```

**Response:**
```json
{
  "id": 1,
  "method_name": "BITCOIN",
  "wallet_address": "1A1z7agoat3xFZ88MP357yvDNy3e7c3DZ9",
  "created_at": "2025-11-22T10:00:00Z",
  "updated_at": "2025-11-22T10:00:00Z"
}
```

---

## 📁 Files Changed

### Backend (7 files modified)
1. `backend/wallet/models.py` - Added WalletAddress model
2. `backend/wallet/admin.py` - Added WalletAddressAdmin
3. `backend/wallet/serializers.py` - Added WalletAddressSerializer
4. `backend/wallet/views.py` - Added WalletAddressView
5. `backend/wallet/urls.py` - Added /address/ route
6. `backend/wallet/migrations/0003_walletaddress.py` - New migration

### Frontend (2 files modified)
7. `src/config/api.ts` - Added WALLET_ADDRESS_BY_METHOD
8. `src/pages/dashboard/ConfirmDeposit.tsx` - Updated to fetch per-method

---

## ✅ Verification Checklist

- [ ] Migration applied: `python manage.py migrate wallet`
- [ ] Admin accessible: `http://localhost:8000/admin`
- [ ] Wallet addresses added for all methods
- [ ] API endpoint returns correct data
- [ ] Frontend displays correct wallet address
- [ ] Test deposit submission works
- [ ] No console errors in browser

---

## 🔄 Data Flow

```
User selects method (BITCOIN)
         ↓
Navigate to confirm page
         ↓
Frontend calls: GET /api/wallet/address/?method=BITCOIN
         ↓
Backend returns wallet address for BITCOIN
         ↓
Frontend displays: "Send funds to: 1A1z7agoat3xFZ88MP357yvDNy3e7c3DZ9"
         ↓
User uploads proof
         ↓
Frontend submits deposit with method field
         ↓
Backend records deposit with method
```

---

## 🛠 Admin Operations

### Create New Wallet Address
1. Admin > Wallet > Wallet Addresses
2. "Add Wallet Address"
3. Fill in method_name and wallet_address
4. Save

### Edit Existing Wallet Address
1. Admin > Wallet > Wallet Addresses
2. Click on the address to edit
3. Update wallet_address (method_name is locked)
4. Save

### Delete Wallet Address
1. Admin > Wallet > Wallet Addresses
2. Select the address
3. Choose "Delete selected wallet addresses"
4. Confirm

---

## 🚨 Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "Wallet address not found" | Method not configured | Add it in admin |
| Empty wallet on frontend | API error or method mismatch | Check console, verify method name |
| 404 on API | Route not registered | Ensure urls.py updated correctly |
| Migration fails | Missing dependencies | `pip install -r requirements.txt` |

---

## 📝 Example Wallet Setup

```
Method: BITCOIN
Address: 1A1z7agoat3xFZ88MP357yvDNy3e7c3DZ9

Method: ETHEREUM
Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f42bE

Method: USDT BEP20
Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f42bE

Method: USDT TRC20
Address: TQHhv1x1pnQHN7VeC3s4b6c6yK5v5c8g3j
```

---

## 🔐 Security Notes

- Wallet addresses stored in database (not in code)
- Admin-only access to edit addresses
- API endpoint is public (read-only) for displaying to users
- Validate addresses in admin (optional enhancement)

---

## 📞 Support

For issues or questions:
1. Check DEPOSIT_WALLET_UPDATE.md for detailed guide
2. Review backend console for Django errors
3. Check browser console for frontend errors
4. Verify database migrations: `python manage.py showmigrations wallet`

---

**Last Updated:** November 22, 2025
