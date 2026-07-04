# Yahoo Finance Rate Limits

## Identificación del Rate Limit

### Observaciones (2026-07-04)

Basado en el error observado con el ticker `ACAG`:

```
ERROR:yfinance:429 Client Error: Too Many Requests for url: 
https://query2.finance.yahoo.com/v10/finance/quoteSummary/ACAG
```

### Características del Rate Limit

1. **Código HTTP**: 429 (Too Many Requests)
2. **Respuesta**: Yahoo Finance devuelve HTML en lugar de JSON cuando alcanzas el límite
3. **Error resultante**: `JSONDecodeError: Expecting value: line 1 column 1 (char 0)`
4. **Endpoint afectado**: `query2.finance.yahoo.com/v10/finance/quoteSummary`

### Límites Estimados (No Oficial)

Yahoo Finance **no publica límites oficiales**, pero basado en la comunidad de yfinance:

| Tipo de Request | Límite Estimado | Ventana de Tiempo |
|----------------|-----------------|-------------------|
| quoteSummary (info) | ~2000 requests | Por hora |
| Múltiples tickers | ~48 requests | Por minuto |
| Requests consecutivas | ~10-20 requests | Sin delay |

⚠️ **Estos límites son aproximados y pueden variar** según:
- Tu IP/localización
- Hora del día (más restrictivo en horario de mercado)
- Si usas proxy corporativo (IP compartida = límite compartido)
- Tipo de ticker (tickers populares vs. obscuros)

### Factores de Tu Entorno

En tu caso específico:
- ✅ **Proxy corporativo**: Tu IP es compartida por muchos usuarios
- ✅ **SSL bypass**: Necesario pero puede afectar el rate limiting
- ✅ **Ticker ACAG**: Ticker poco común, puede tener menos caché en Yahoo

### Soluciones Implementadas

1. **Detección de Rate Limit**
   - Captura de HTTP 429
   - Detección de JSONDecodeError (HTML en lugar de JSON)
   - Mensajes de error claros al usuario

2. **Mensaje al Usuario**
   ```
   Yahoo Finance rate limit exceeded or service unavailable. 
   Please wait a few minutes before trying again.
   ```

### Recomendaciones

#### Para Uso Inmediato
1. **Esperar 5-15 minutos** entre requests fallidos
2. **Probar con tickers populares** (AAPL, MSFT, GOOGL) - mejor cache
3. **Evitar tickers obscuros** durante rate limiting

#### Para Producción (Future Improvements)

1. **Implementar Retry con Backoff Exponencial**
   ```python
   from tenacity import retry, stop_after_attempt, wait_exponential
   
   @retry(
       stop=stop_after_attempt(3),
       wait=wait_exponential(multiplier=1, min=4, max=60)
   )
   def fetch_with_retry(ticker):
       return yf.Ticker(ticker).info
   ```

2. **Cache Local**
   - Guardar datos de yfinance en la base de datos
   - Solo refrescar cada 24 horas para mismo ticker
   - Reducir requests innecesarias

3. **Request Pooling**
   - Si múltiples usuarios piden el mismo ticker, hacer una sola request
   - Usar Redis para sincronización

4. **Fallback a Fuentes Alternativas**
   - Alpha Vantage (5 API calls/min gratis)
   - Financial Modeling Prep (250 calls/día gratis)
   - IEX Cloud (50k messages/mes gratis)

### Enlaces Útiles

- [yfinance GitHub Issues sobre Rate Limiting](https://github.com/ranaroussi/yfinance/issues?q=rate+limit)
- [Yahoo Finance API (No oficial)](https://www.yahoofinanceapi.com/)
- [Discusión sobre Rate Limits](https://github.com/ranaroussi/yfinance/issues/1729)

## Monitoreo

Para ver el patrón de rate limiting en tus logs:

```powershell
# Ver todos los requests de enrichment
docker logs marketwhisper-enrichment 2>&1 | Select-String "Enriching company"

# Ver errores 429
docker logs marketwhisper-enrichment 2>&1 | Select-String "429|Too Many"

# Contar requests por minuto (aproximado)
docker logs marketwhisper-enrichment 2>&1 | Select-String "Enriching" | Measure-Object
```
