#!/bin/bash
# backend/start.sh

echo "🚑 Starting AIDA Backend (Gemini free tier)..."

if ! command -v python3 &> /dev/null; then echo "❌ Python 3 not found."; exit 1; fi

if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
echo "📥 Installing dependencies..."
pip install -r requirements.txt -q

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "👉 Open backend/.env, paste your GEMINI_API_KEY, then re-run."
    echo "   Get free key at: https://aistudio.google.com"
    exit 1
fi

export $(grep -v '^#' .env | xargs)

if [ -z "$GEMINI_API_KEY" ] || [ "$GEMINI_API_KEY" = "AIza-your-key-here" ]; then
    echo "❌ GEMINI_API_KEY not set in backend/.env"
    echo "   Get your FREE key at: https://aistudio.google.com"
    exit 1
fi

echo "✅ Gemini API key found"

LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
[ -z "$LOCAL_IP" ] && LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null)
if [ -n "$LOCAL_IP" ]; then
    echo ""
    echo "📱 Update services/api.js:"
    echo "   BASE_URL = 'http://$LOCAL_IP:8000'"
fi

echo ""
echo "🌐 Server starting on http://0.0.0.0:8000"
echo "🔗 Health check: http://localhost:8000/health"
echo ""
uvicorn main:app --reload --host 0.0.0.0 --port 8000
