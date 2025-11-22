#!/bin/bash
# Quick Setup Script for Deposit Wallet Address System Update

echo "================================================"
echo "Deposit System - Wallet Address Update Setup"
echo "================================================"
echo ""

# Navigate to backend directory
cd backend || exit 1

echo "Step 1: Activating virtual environment..."
if [ -d "venv" ]; then
    source venv/Scripts/activate 2>/dev/null || source venv/bin/activate
    echo "✓ Virtual environment activated"
else
    echo "✗ Virtual environment not found. Please create one with: python -m venv venv"
    exit 1
fi

echo ""
echo "Step 2: Installing dependencies..."
pip install -r requirements.txt > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Dependencies installed"
else
    echo "✗ Failed to install dependencies"
    exit 1
fi

echo ""
echo "Step 3: Running database migrations..."
python manage.py migrate wallet
if [ $? -eq 0 ]; then
    echo "✓ Migrations applied successfully"
else
    echo "✗ Migration failed"
    exit 1
fi

echo ""
echo "Step 4: Creating superuser (if needed)..."
read -p "Do you need to create a superuser? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    python manage.py createsuperuser
fi

echo ""
echo "================================================"
echo "Setup Complete!"
echo "================================================"
echo ""
echo "Next Steps:"
echo "1. Start the development server:"
echo "   python manage.py runserver"
echo ""
echo "2. Access Django Admin:"
echo "   http://localhost:8000/admin"
echo ""
echo "3. Add wallet addresses:"
echo "   - Go to Wallet > Wallet Addresses"
echo "   - Click 'Add Wallet Address'"
echo "   - Enter method name and wallet address"
echo "   - Repeat for each payment method"
echo ""
echo "4. Test the deposit flow:"
echo "   - Go to Deposit page on frontend"
echo "   - Select a payment method"
echo "   - Confirm the wallet address appears"
echo ""
