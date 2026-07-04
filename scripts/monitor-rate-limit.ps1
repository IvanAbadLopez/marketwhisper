# Monitor Yahoo Finance Rate Limiting
# Este script monitorea los logs del servicio de enrichment en tiempo real
# para identificar patrones de rate limiting

Write-Host "=== Yahoo Finance Rate Limit Monitor ===" -ForegroundColor Cyan
Write-Host "Monitoreando logs del servicio de enrichment..." -ForegroundColor Gray
Write-Host ""

# Función para mostrar estadísticas
function Show-Stats {
    Write-Host "`n=== ESTADÍSTICAS ===" -ForegroundColor Yellow
    
    # Total de requests
    $totalRequests = docker logs marketwhisper-enrichment 2>&1 | Select-String "\[ENRICH START\]" | Measure-Object | Select-Object -ExpandProperty Count
    Write-Host "Total requests iniciados: $totalRequests" -ForegroundColor White
    
    # Requests exitosos
    $successfulRequests = docker logs marketwhisper-enrichment 2>&1 | Select-String "\[ENRICH COMPLETE\]" | Measure-Object | Select-Object -ExpandProperty Count
    Write-Host "Requests completados: $successfulRequests" -ForegroundColor Green
    
    # Rate limits detectados
    $rateLimits = docker logs marketwhisper-enrichment 2>&1 | Select-String "RATE LIMIT" | Measure-Object | Select-Object -ExpandProperty Count
    Write-Host "Rate limits detectados: $rateLimits" -ForegroundColor Red
    
    # Errores 429
    $errors429 = docker logs marketwhisper-enrichment 2>&1 | Select-String "429" | Measure-Object | Select-Object -ExpandProperty Count
    Write-Host "Errores HTTP 429: $errors429" -ForegroundColor Red
    
    # Tasa de éxito
    if ($totalRequests -gt 0) {
        $successRate = [math]::Round(($successfulRequests / $totalRequests) * 100, 2)
        Write-Host "Tasa de éxito: $successRate%" -ForegroundColor $(if ($successRate -gt 80) { "Green" } elseif ($successRate -gt 50) { "Yellow" } else { "Red" })
    }
    
    Write-Host "`n=== ÚLTIMOS EVENTOS ===" -ForegroundColor Yellow
    
    # Mostrar últimos requests
    Write-Host "`nÚltimos 5 requests:" -ForegroundColor Cyan
    docker logs marketwhisper-enrichment 2>&1 | Select-String "\[ENRICH START\]|\[ENRICH COMPLETE\]|\[RATE LIMIT" | Select-Object -Last 5 | ForEach-Object {
        $line = $_.Line
        if ($line -match "ENRICH START") {
            Write-Host "  → $line" -ForegroundColor Gray
        } elseif ($line -match "ENRICH COMPLETE") {
            Write-Host "  ✓ $line" -ForegroundColor Green
        } elseif ($line -match "RATE LIMIT") {
            Write-Host "  ✗ $line" -ForegroundColor Red
        }
    }
    
    # Tiempos de respuesta
    Write-Host "`nTiempos de respuesta exitosos:" -ForegroundColor Cyan
    docker logs marketwhisper-enrichment 2>&1 | Select-String "Total time: (\d+\.\d+)s" | Select-Object -Last 5 | ForEach-Object {
        if ($_.Line -match "Total time: (\d+\.\d+)s") {
            $time = $matches[1]
            $ticker = if ($_.Line -match "\[ENRICH COMPLETE\] (\w+)") { $matches[1] } else { "???" }
            Write-Host "  $ticker → ${time}s" -ForegroundColor White
        }
    }
}

# Opción de modo
$mode = $args[0]

if ($mode -eq "live") {
    # Modo live: seguir logs en tiempo real
    Write-Host "Modo LIVE activado. Presiona Ctrl+C para detener." -ForegroundColor Green
    Write-Host ""
    docker logs -f marketwhisper-enrichment 2>&1 | ForEach-Object {
        $line = $_
        if ($line -match "ENRICH START") {
            Write-Host $line -ForegroundColor Cyan
        } elseif ($line -match "ENRICH COMPLETE") {
            Write-Host $line -ForegroundColor Green
        } elseif ($line -match "RATE LIMIT|429") {
            Write-Host $line -ForegroundColor Red
        } elseif ($line -match "ERROR") {
            Write-Host $line -ForegroundColor Yellow
        } else {
            Write-Host $line -ForegroundColor Gray
        }
    }
} else {
    # Modo estadísticas
    Show-Stats
    
    Write-Host "`n=== COMANDOS ÚTILES ===" -ForegroundColor Yellow
    Write-Host "Ver logs en tiempo real:" -ForegroundColor White
    Write-Host "  .\monitor-rate-limit.ps1 live" -ForegroundColor Gray
    Write-Host "`nVer todos los errores de rate limit:" -ForegroundColor White
    Write-Host "  docker logs marketwhisper-enrichment 2>&1 | Select-String 'RATE LIMIT|429'" -ForegroundColor Gray
    Write-Host "`nLimpiar logs del contenedor:" -ForegroundColor White
    Write-Host "  docker compose restart enrichment" -ForegroundColor Gray
    Write-Host ""
}
