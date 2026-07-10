# Initialize Ollama with qwen2.5:7b model
# This script should be run after docker compose up to pull the model

Write-Host "🤖 Initializing Ollama with qwen2.5:7b model..." -ForegroundColor Cyan
Write-Host "This may take a few minutes (model size: ~4.7GB)"

# Wait for Ollama service to be ready
Write-Host "Waiting for Ollama service to start..."
Start-Sleep -Seconds 10

# Pull the model
docker exec marketwhisper-ollama ollama pull qwen2.5:7b

Write-Host "✅ Ollama initialized successfully!" -ForegroundColor Green
Write-Host "Model: qwen2.5:7b is ready for enrichment analysis"
