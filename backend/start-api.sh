#!/bin/bash
source /var/www/codescope/venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

