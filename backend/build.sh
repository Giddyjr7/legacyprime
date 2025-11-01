#!/usr/bin/env bash

# Exit on error
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Collect static files (needed if you serve static files like Django Admin)
python manage.py collectstatic --no-input