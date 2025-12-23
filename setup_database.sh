#!/bin/bash

# Setup Database Script
# This script initializes the database with required data

echo "======================================"
echo "  PR TRAVELS - Database Setup Script"
echo "======================================"
echo ""

# Change to backend directory
cd "$(dirname "$0")/backend"

# Activate virtual environment
if [ -d "venv" ]; then
    echo "✓ Activating virtual environment..."
    source venv/bin/activate
else
    echo "✗ Virtual environment not found!"
    echo "  Please run: python -m venv venv"
    exit 1
fi

# Seed user statuses
echo ""
echo "📊 Step 1: Seeding user statuses..."
echo "======================================"
python -m app.db.seed_statuses

# Seed user roles
echo ""
echo "🎭 Step 2: Seeding user roles..."
echo "======================================"
python -m app.db.seed_roles

echo ""
echo "======================================"
echo "✅ Database setup complete!"
echo "======================================"
echo ""
echo "Summary:"
echo "  ✓ User statuses initialized (5 statuses)"
echo "  ✓ User roles initialized (10 roles)"
echo "  ✓ Sreekanth set as Super Admin"
echo ""

