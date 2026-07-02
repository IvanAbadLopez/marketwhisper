# Initialize Ollama with llama3.1:8b model
# This script should be run after docker compose up to pull the model

Write-Host "🤖 Initializing Ollama with llama3.1:8b model..." -ForegroundColor Cyan
Write-Host "This may take a few minutes (model size: ~4.7GB)"

# Wait for Ollama service to be ready
Write-Host "Waiting for Ollama service to start..."
Start-Sleep -Seconds 10

# Pull the model
docker exec marketwhisper-ollama ollama pull llama3.1:8b

Write-Host "✅ Ollama initialized successfully!" -ForegroundColor Green
Write-Host "Model: llama3.1:8b is ready for enrichment analysis"
