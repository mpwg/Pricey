#!/bin/bash
# Start Ollama on Mac with GPU acceleration on port 10000
# Copyright (C) 2025 Matthias Wallner-Géhri
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

set -e

echo "🚀 Starting Ollama on Mac with GPU acceleration..."
echo ""
echo "Port: 10000"
echo "Model: llava (vision model)"
echo ""
echo "To use this in Pricey, set in your .env.local:"
echo "  LLM_BASE_URL=http://localhost:10000"
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed!"
    echo ""
    echo "Install with: brew install ollama"
    exit 1
fi

# Check if llava model is available
if ! ollama list | grep -q "llava"; then
    echo "📥 Downloading llava vision model (this may take a few minutes)..."
    ollama pull llava
fi

echo "✅ Starting Ollama server on http://localhost:10000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start Ollama on port 10000
OLLAMA_HOST=0.0.0.0:10000 ollama serve
