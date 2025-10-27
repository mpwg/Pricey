#!/bin/bash

# Setup Ollama with Receipt Parsing Model
# Copyright (C) 2025 Matthias Wallner-Géhri
# Licensed under AGPL-3.0

set -e

echo "🚀 Setting up Ollama for receipt parsing..."

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama service to start..."
until curl -s http://localhost:11434/api/tags > /dev/null 2>&1; do
  sleep 2
done

echo "✅ Ollama is ready!"

# Pull the default model (Llama 3.2 3B - good balance of speed and accuracy)
echo "📥 Pulling llama3.2:3b model (recommended for receipt parsing)..."
docker exec pricey-ollama ollama pull llama3.2:3b

# Optional: Pull alternative models
echo ""
echo "📋 Available alternative models (uncomment to pull):"
echo "  - Mistral 7B (better accuracy, slower):  docker exec pricey-ollama ollama pull mistral:7b"
echo "  - Llama 3.2 1B (faster, less accurate):  docker exec pricey-ollama ollama pull llama3.2:1b"
echo "  - Phi-3 Mini (Microsoft, compact):        docker exec pricey-ollama ollama pull phi3:mini"
echo ""

# Optional: Uncomment to pull Mistral as well
# echo "📥 Pulling mistral:7b model..."
# docker exec pricey-ollama ollama pull mistral:7b

echo ""
echo "✅ Ollama setup complete!"
echo ""
echo "🧪 Test the model with:"
echo "   curl http://localhost:11434/api/generate -d '{\"model\":\"llama3.2:3b\",\"prompt\":\"Parse this receipt: Store: Walmart Date: 2025-10-27 Total: $25.99\",\"stream\":false}'"
echo ""
echo "📝 Available models:"
docker exec pricey-ollama ollama list
