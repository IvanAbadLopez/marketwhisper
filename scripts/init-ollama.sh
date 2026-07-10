#!/bin/bash
# Initialize Ollama with qwen2.5:7b model
# This script should be run after docker compose up to pull the model

echo "🤖 Initializing Ollama with qwen2.5:7b model..."
echo "This may take a few minutes (model size: ~4.7GB)"

# Wait for Ollama service to be ready
echo "Waiting for Ollama service to start..."
sleep 10

# Pull the model
docker exec marketwhisper-ollama ollama pull qwen2.5:7b

echo "✅ Ollama initialized successfully!"
echo "Model: qwen2.5:7b is ready for enrichment analysis"
