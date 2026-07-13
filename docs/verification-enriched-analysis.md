# Verificación: Análisis enriquecido con Finnhub

## ✅ COMPLETADO - Todas las fases implementadas

### Implementación realizada

**Objetivo:** Minimizar llamadas LLM a 2 total (no por empresa), enriquecer análisis con datos financieros de Finnhub, persistir snapshot, y mostrar en UI.

**Arquitectura (5 fases):**
1. detectCompanies(text) — LLM #1 ligero
2. resolve tickers + find/create companies
3. getCachedFinnhub (TTL 24h) o fetchFinnhubData (serial por rate limits)
4. analyzeWithFinancials(text, companies) — LLM #2 enriquecido con todos los datos financieros
5. crear Analysis con financialSnapshot persistido

**Mejoras incluidas:**
- ✅ Cache financiero (24h TTL) reduce llamadas Finnhub
- ✅ Snapshot persistido en cada Analysis
- ✅ Prompt instruye LLM a contrastar narrativa vs fundamentals (detecta divergencias)
- ✅ formatFinancialsBlock compartido entre processEnrichment y processAnalysis
- ✅ Componente UI colapsable muestra: precio/P/E/EPS/52w high/low/consenso analistas

**Archivos clave:**
- src/shared/api/finnhub.ts — cliente centralizado + utils
- src/shared/api/ollama.ts — 2-phase LLM approach
- src/features/analyze-text/api/processAnalysis.ts — orquestación completa
- src/entities/analysis/ui/FinancialSnapshot.tsx — componente UI
- prisma/schema.prisma — campo financialSnapshot Json?

## Pasos de verificación manual

### 1. Iniciar servicios
```powershell
docker compose up -d
```

### 2. Probar análisis de Alibaba (caso original)
1. Navegar a http://localhost:3000/analyze
2. Pegar texto en español:
```
Alibaba ha mostrado un crecimiento impresionante en el último trimestre. 
Los analistas esperan que continúe expandiéndose en mercados internacionales.
```
3. Hacer clic en "Analizar Texto"
4. Esperar completion del job

### 3. Verificar backend logs
```powershell
docker compose logs -f web
```

**Revisar que aparezcan:**
- [Job xxx] Phase 1: Detecting companies...
- Detected 1 companies: Alibaba
- [Job xxx] Phase 2: Resolving tickers...
- Ticker missing for "Alibaba", resolving via Finnhub...
- Created new company: BABA
- [Job xxx] Phase 3: Fetching financial data...
- Fetching fresh Finnhub data for BABA...
- [Job xxx] Phase 4: Analyzing with financial data (1 LLM call for all companies)...
- [Job xxx] Phase 5: Saving analyses with financial snapshots...
- Analysis completed successfully: 1 companies analyzed (2 LLM calls total)

**Contar llamadas LLM:** Debe haber EXACTAMENTE 2 llamadas a ollama:11434/api/generate

### 4. Verificar UI
1. Navegar a http://localhost:3000/jobs
2. Verificar que el job aparece como COMPLETED con ticker BABA
3. Hacer clic en el análisis
4. **Verificar componente FinancialSnapshot:**
   - Debe aparecer bajo el reasoning
   - Botón "Financial Data" colapsable con fecha
   - Al expandir: Price, P/E, EPS, 52w High, 52w Low, Consensus
   - Valores reales de Finnhub (no "N/A")

### 5. Verificar cache
1. Realizar SEGUNDO análisis con el mismo texto de Alibaba
2. Revisar logs: debe decir "Using cached Finnhub data for BABA"
3. NO debe llamar a enrichment service (puerto 8001)
4. Cache válido por 24 horas

### 6. Probar múltiples empresas
```
Apple y Microsoft están dominando el sector tecnológico. 
Ambas empresas reportaron ganancias récord.
```

**Verificar:**
- Phase 1 detecta 2 companies
- Phase 3 fetches serial (AAPL primero, MSFT segundo) por rate limits
- Phase 4 hace 1 sola llamada LLM con ambas empresas
- Phase 5 crea 2 Analysis records con snapshots
- Total: 2 LLM calls (no 3)

### 7. Verificar fallback sin Finnhub
1. Detener enrichment service: `docker compose stop enrichment`
2. Analizar texto nuevo (empresa no cacheada)
3. Verificar que:
   - Job completa con WARNING en logs
   - Analysis se crea SIN financialSnapshot
   - UI no muestra sección Financial Data
   - Análisis se basa solo en texto

## Queries de verificación (opcional)

```sql
-- Ver snapshots guardados
SELECT 
  id, 
  ticker, 
  sentiment, 
  jsonb_pretty(financialSnapshot::jsonb) as snapshot,
  createdAt
FROM "Analysis"
WHERE "financialSnapshot" IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 5;

-- Cache hit rate (últimas 24h)
SELECT 
  COUNT(*) FILTER (WHERE "financialSnapshot" IS NOT NULL) as con_snapshot,
  COUNT(*) FILTER (WHERE "financialSnapshot" IS NULL) as sin_snapshot,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE "financialSnapshot" IS NOT NULL) / COUNT(*),
    2
  ) as porcentaje_snapshot
FROM "Analysis"
WHERE "createdAt" >= NOW() - INTERVAL '24 hours';
```

## Checklist final

- [x] Schema Prisma con financialSnapshot
- [x] Cliente Finnhub centralizado en shared
- [x] LLM split en 2 fases (detect + analyze)
- [x] Cache con TTL 24h implementado
- [x] Snapshot persistido en cada Analysis
- [x] Prompt con divergence detection
- [x] Serial fetching por rate limits
- [x] Componente UI FinancialSnapshot
- [x] AnalysisCard integra snapshot
- [x] Tipos actualizados (entities/analysis)
- [x] i18n keys (en.json + es.json)
- [ ] Tests unitarios (pendiente)
- [ ] Verificación manual (ejecutar pasos arriba)

## Próximos pasos sugeridos

1. **Fase 5 - Tests:** Cobertura para detectCompanies, analyzeWithFinancials, getCachedFinnhub, processAnalysis
2. **Monitoreo:** Agregar métricas de cache hit rate y tiempo de análisis
3. **Optimización:** Considerar batch endpoint en enrichment service para múltiples tickers
