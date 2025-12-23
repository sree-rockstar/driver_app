#!/bin/bash

echo "========================================="
echo "  Driver App - Status System Setup"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "backend/app/db/seed_statuses.py" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Step 1: Installing backend dependencies..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt
echo "✅ Dependencies installed"
echo ""

echo "💾 Step 2: Seeding user statuses..."
python app/db/seed_statuses.py
echo ""

echo "👤 Step 3: Creating admin user..."
cd ..
python create_admin.py
echo ""

echo "========================================="
echo "✅ Status System Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Start backend: cd backend && python main.py"
echo "2. Start frontend: cd frontend && npm run dev"
echo "3. Login as admin"
echo "4. Go to Admin > Statuses to view statuses"
echo "5. Register a test user"
echo "6. User sets MPIN"
echo "7. Admin approves user"
echo ""
echo "📚 Documentation:"
echo "- STATUS_SYSTEM.md - Complete status system guide"
echo "- MOBILE_REGISTRATION.md - Registration guide"
echo "- API_EXAMPLES.md - API examples"
echo ""

