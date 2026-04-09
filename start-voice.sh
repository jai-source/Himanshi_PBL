#!/bin/bash
# Voice Control System - Start Script
# This script helps you quickly start the voice detection system

echo "🚀 Detectify Voice Control System - Startup"
echo "==========================================="
echo ""

# Check if Node modules are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
    echo "✅ Dependencies installed"
fi

echo ""
echo "🔧 Starting application..."
echo "   - Backend server on port 8080"
echo "   - Frontend on port 5173"
echo ""

# Start the development servers
echo "💡 Tip: You can access the app at http://localhost:5173/"
echo "💡 Tip: Voice control page is at http://localhost:5173/voice (after login)"
echo ""

# Run the dev command (adjust based on your package.json setup)
pnpm dev

