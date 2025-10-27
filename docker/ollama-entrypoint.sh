#!/bin/bash
# Ollama entrypoint script - Auto-pulls model on startup
# Copyright (C) 2025 Matthias Wallner-Géhri
# Licensed under AGPL-3.0

set -e

echo "🚀 Starting Ollama server..."

# Start Ollama in the background
ollama serve &
OLLAMA_PID=$!

echo "⏳ Waiting for Ollama server to be ready..."
# Wait for Ollama to be ready (max 60 seconds)
for i in {1..60}; do
  if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama server is ready!"
    break
  fi
  if [ $i -eq 60 ]; then
    echo "❌ Timeout waiting for Ollama server"
    exit 1
  fi
  sleep 1
done

# Pull the model if OLLAMA_MODEL is set and not empty
if [ -n "${OLLAMA_MODEL}" ]; then
  echo "📥 Checking if model '${OLLAMA_MODEL}' is available..."
  
  # Check if model already exists
  if ollama list | grep -q "${OLLAMA_MODEL}"; then
    echo "✅ Model '${OLLAMA_MODEL}' already exists, skipping download"
  else
    echo "📥 Pulling model '${OLLAMA_MODEL}'..."
    echo "   This may take a few minutes on first run..."
    if ollama pull "${OLLAMA_MODEL}"; then
      echo "✅ Model '${OLLAMA_MODEL}' downloaded successfully!"
    else
      echo "❌ Failed to pull model '${OLLAMA_MODEL}'"
      echo "   The server will continue running, but you'll need to pull the model manually."
    fi
  fi
else
  echo "ℹ️  No OLLAMA_MODEL specified, skipping model download"
  echo "   Set OLLAMA_MODEL environment variable to auto-download a model"
fi

echo "🎉 Ollama is ready and serving on port 11434"
echo ""
echo "📋 Available models:"
ollama list || echo "   (none yet - set OLLAMA_MODEL to auto-download)"
echo ""

# Keep the container running by waiting for the Ollama process
wait $OLLAMA_PID
