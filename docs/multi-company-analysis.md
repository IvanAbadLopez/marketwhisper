# Análisis Multi-Empresa

## 🎯 Funcionalidad

El sistema ahora puede **detectar y analizar múltiples empresas** en un mismo texto. Cuando introduces un texto que menciona varias compañías, la IA creará análisis individuales para cada una, con su propio sentiment y reliability score.

## 📝 Ejemplos de Uso

### Ejemplo 1: Comparación de Empresas

**Texto de entrada:**
```
Apple reportó ingresos récord en el Q4 con ventas de iPhone superando expectativas (+15% YoY).
Sin embargo, Microsoft está enfrentando desafíos en Azure con crecimiento desacelerando a 25%.
Tesla anunció entregas récord con 500,000 vehículos en el trimestre.
```

**Resultado esperado:**
- ✅ **AAPL** - BULLISH (Reliability: 8/10)
  - _"Ingresos récord e iPhone superando expectativas indica fuerte desempeño"_
  
- ⚠️ **MSFT** - BEARISH (Reliability: 7/10)
  - _"Desafíos en Azure y desaceleración del crecimiento sugieren preocupaciones"_
  
- ✅ **TSLA** - BULLISH (Reliability: 8/10)
  - _"Entregas récord demuestran fuerte demanda y ejecución"_

### Ejemplo 2: Análisis de Sector

**Texto de entrada:**
```
El sector tecnológico mostró señales mixtas hoy. NVDA cayó 3% por preocupaciones de 
inventario mientras AMD subió 5% tras ganar contratos con grandes clientes cloud.
```

**Resultado esperado:**
- ⚠️ **NVDA** - BEARISH (Reliability: 6/10)
- ✅ **AMD** - BULLISH (Reliability: 7/10)

### Ejemplo 3: Una Sola Empresa (Compatibilidad)

**Texto de entrada:**
```
Google presentó Gemini 2.0, su modelo de IA más avanzado con capacidades 
multimodales que supera a GPT-4 en varios benchmarks.
```

**Resultado esperado:**
- ✅ **GOOGL** - BULLISH (Reliability: 8/10)

## 🔧 Implementación Técnica

### API Endpoint: `POST /api/analyze`

**Request:**
```json
{
  "text": "AAPL subió 5% mientras MSFT bajó 2%",
  "source": "Bloomberg" // opcional
}
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "message": "Successfully analyzed 2 companies",
  "analyses": [
    {
      "id": "abc123",
      "ticker": "AAPL",
      "sentiment": "BULLISH",
      "reliabilityScore": 7,
      "reasoning": "El texto indica un aumento significativo del 5%",
      "company": {
        "ticker": "AAPL",
        "name": "Apple Inc."
      }
    },
    {
      "id": "def456",
      "ticker": "MSFT",
      "sentiment": "BEARISH",
      "reliabilityScore": 6,
      "reasoning": "La caída del 2% sugiere presión bajista",
      "company": {
        "ticker": "MSFT",
        "name": "Microsoft Corporation"
      }
    }
  ],
  "companies": [...]
}
```

### Flujo de Procesamiento

1. **Usuario introduce texto** → SyncButton component
2. **POST /api/analyze** → Endpoint recibe texto
3. **Gemini AI analiza** → Detecta TODAS las empresas mencionadas
4. **Para cada empresa detectada:**
   - Busca o crea Company en DB
   - Crea registro Analysis individual
   - Recalcula scores agregados (avgSentiment, avgReliability)
5. **Respuesta con múltiples resultados** → UI muestra lista de análisis
6. **Auto-refresh** → Página se recarga para mostrar datos actualizados

## 💡 Ventajas

✅ **Análisis Contextual**: Cada empresa recibe su propio sentiment basado en cómo se habla de ella específicamente
✅ **Ahorro de Tiempo**: Un solo texto puede actualizar múltiples empresas
✅ **Comparaciones**: Ideal para análisis de sector o noticias comparativas
✅ **Precisión**: La IA evalúa cada mención de forma independiente
✅ **Escalabilidad**: No hay límite en el número de empresas detectadas

## 🎨 Interfaz de Usuario

El componente `SyncButton` ahora muestra:
- Contador de empresas detectadas
- Lista vertical con cada análisis
- Iconos de sentiment (📈 BULLISH, 📉 BEARISH, ➖ NEUTRAL)
- Reliability score individual
- Reasoning específico para cada empresa
- Separadores visuales entre empresas

## 📊 Base de Datos

### Modelo Analysis
```prisma
model Analysis {
  id               String    @id @default(cuid())
  text             String    // Texto original (compartido si viene del mismo input)
  source           String?   // Fuente opcional
  companyId        String    // Empresa detectada
  company          Company   @relation(...)
  ticker           String    // Ticker symbol
  sentiment        Sentiment // BULLISH | BEARISH | NEUTRAL
  reliabilityScore Int       // 1-10
  reasoning        String    // Explicación de la IA
  createdAt        DateTime  @default(now())
}
```

**Nota**: Si introduces "AAPL +5%, MSFT -2%", se crearán **2 registros Analysis** con el mismo `text` pero diferente `companyId`, `ticker`, `sentiment`, y `reasoning`.

## 🧪 Testing Manual

1. Ve a la aplicación
2. Click en "Analyze Text"
3. Pega este texto:
   ```
   Netflix reportó 8M nuevos subscriptores superando estimados.
   Disney+ perdió 2M subscriptores en contraste, enfrentando competencia.
   ```
4. Observa cómo se crean 2 análisis:
   - NFLX (BULLISH)
   - DIS (BEARISH)
5. Navega a `/situations` para ver ambas empresas actualizadas

## 🔮 Casos de Uso

1. **Resúmenes de Noticias**: Analiza un artículo que menciona múltiples empresas
2. **Comparaciones de Sector**: "Tech ganó hoy: AAPL +3%, MSFT +2%, pero GOOGL -1%"
3. **Análisis de Earnings**: "Sector financiero reportó: JPM beat, BAC missed, WFC inline"
4. **Tweets Multi-Empresa**: Social media posts que mencionan varias tickers
5. **Análisis de Eventos**: "Merger MSFT-ATVI impacta: MSFT -1%, ATVI +15%, SONY -2%"

---

**Fecha de Implementación**: 2026-07-02  
**Archivos Modificados**:
- `src/lib/gemini.ts` - Prompt multi-empresa y array response (migrado de Ollama)
- `src/app/api/analyze/route.ts` - Loop sobre resultados múltiples
- `src/components/SyncButton.tsx` - UI para mostrar lista de análisis
