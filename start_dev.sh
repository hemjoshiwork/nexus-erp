#!/bin/bash
set -e

echo "Installing backend dependencies..."
python3 -m pip install -r backend/requirements.txt

echo "Initializing Database..."
# Use module syntax for imports to work correctly
cd backend
python3 -m app.init_db

echo "Seeding Admin User..."
python3 -m app.seed
cd ..

echo "--------------------------------------------------------"
echo "Backend Ready! Run: python3 -m uvicorn backend.app.main:app --reload"
echo "--------------------------------------------------------"
