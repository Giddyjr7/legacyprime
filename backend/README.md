# LegacyPrime Backend

Minimal Django + DRF scaffold for LegacyPrime.

Setup (Windows PowerShell):

```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd backend
python manage.py migrate
python manage.py runserver
```

Environment variables (create a `.env` file or set in system):

- SECRET_KEY
- DEBUG (True/False)
- EMAIL_HOST
- EMAIL_PORT
- EMAIL_HOST_USER
- EMAIL_HOST_PASSWORD
- EMAIL_USE_TLS (True/False)
- DEFAULT_FROM_EMAIL

Endpoints (initial):

- POST /api/accounts/register/
- POST /api/accounts/login/
- POST /api/accounts/verify-otp/
- POST /api/transactions/deposit/
- POST /api/transactions/withdraw/
- GET  /api/transactions/
- POST /api/notifications/send-otp/

Notes: deposit/withdrawal statuses default to "pending". OTPs are stored in `UserOTP` table.
