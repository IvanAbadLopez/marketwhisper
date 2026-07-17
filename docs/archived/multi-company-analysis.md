# Multi-Company Analysis

## 🎯 Functionality

The system can now **detect and analyze multiple companies** in a single text. When you enter text mentioning multiple companies, the AI will create individual analyses for each one, with its own sentiment and reliability score.

## 📝 Usage Examples

### Example 1: Company Comparison

**Input text:**
```
Apple reportó ingresos récord en el Q4 con ventas de iPhone superando expectativas (+15% YoY).
Sin embargo, Microsoft está enfrentando desafíos en Azure con crecimiento desacelerando a 25%.
Tesla anunció entregas récord con 500,000 vehículos en el trimestre.
```

**Expected result:**
- ✅ **AAPL** - BULLISH (Reliability: 8/10)
  - _"Record revenues and iPhone exceeding expectations indicates strong performance"_
  
- ⚠️ **MSFT** - BEARISH (Reliability: 7/10)
  - _"Azure challenges and growth slowdown suggest concerns"_
  
- ✅ **TSLA** - BULLISH (Reliability: 8/10)
  - _"Record deliveries demonstrate strong demand and execution"_

### Example 2: Sector Analysis

**Input text:**
```
El sector tecnológico mostró señales mixtas hoy. NVDA cayó 3% por preocupaciones de 
inventario mientras AMD subió 5% tras ganar contratos con grandes clientes cloud.
```

**Expected result:**
- ⚠️ **NVDA** - BEARISH (Reliability: 6/10)
- ✅ **AMD** - BULLISH (Reliability: 7/10)

### Example 3: Single Company (Compatibility)

**Input text:**
```
Google presentó su modelo de IA más avanzado con capacidades 
multimodales que supera a GPT-4 en varios benchmarks.
```

**Expected result:**
- ✅ **GOOGL** - BULLISH (Reliability: 8/10)

## 🔧 Technical Implementation

### API Endpoint: `POST /api/analyze`

**Request:**
```json
{
  "text": "AAPL subió 5% mientras MSFT bajó 2%",
  "source": "Bloomberg" // optional
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
      "reasoning": "The text indicates a significant 5% increase",
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
      "reasoning": "The 2% drop suggests bearish pressure",
      "company": {
        "ticker": "MSFT",
        "name": "Microsoft Corporation"
      }
    }
  ],
  "companies": [...]
}
```

### Processing Flow

1. **User enters text** → SyncButton component
2. **POST /api/analyze** → Endpoint receives text
3. **Ollama AI analyzes** → Detects ALL mentioned companies
4. **For each detected company:**
   - Find or create Company in DB
   - Create individual Analysis record
   - Recalculate aggregate scores (avgSentiment, avgReliability)
5. **Response with multiple results** → UI displays analysis list
6. **Auto-refresh** → Page reloads to show updated data

## 💡 Advantages

✅ **Contextual Analysis**: Each company receives its own sentiment based on how it's specifically mentioned
✅ **Time Saving**: Single text can update multiple companies
✅ **Comparisons**: Ideal for sector analysis or comparative news
✅ **Precision**: AI evaluates each mention independently
✅ **Scalability**: No limit on number of detected companies

## 🎨 User Interface

The `SyncButton` component now displays:
- Counter of detected companies
- Vertical list with each analysis
- Sentiment icons (📈 BULLISH, 📉 BEARISH, ➖ NEUTRAL)
- Individual reliability score
- Specific reasoning for each company
- Visual separators between companies

## 📊 Database

### Analysis Model
```prisma
model Analysis {
  id               String    @id @default(cuid())
  text             String    // Original text (shared if from same input)
  source           String?   // Optional source
  companyId        String    // Detected company
  company          Company   @relation(...)
  ticker           String    // Ticker symbol
  sentiment        Sentiment // BULLISH | BEARISH | NEUTRAL
  reliabilityScore Int       // 1-10
  reasoning        String    // AI explanation
  createdAt        DateTime  @default(now())
}
```

**Note**: If you enter "AAPL +5%, MSFT -2%", **2 Analysis records** will be created with the same `text` but different `companyId`, `ticker`, `sentiment`, and `reasoning`.

## 🧪 Manual Testing

1. Go to the application
2. Click "Analyze Text"
3. Paste this text:
   ```
   Netflix reportó 8M nuevos subscriptores superando estimados.
   Disney+ perdió 2M subscriptores en contraste, enfrentando competencia.
   ```
4. Observe how 2 analyses are created:
   - NFLX (BULLISH)
   - DIS (BEARISH)
5. Navigate to `/situations` to see both updated companies

## 🔮 Use Cases

1. **News Summaries**: Analyze an article mentioning multiple companies
2. **Sector Comparisons**: "Tech gained today: AAPL +3%, MSFT +2%, but GOOGL -1%"
3. **Earnings Analysis**: "Financial sector reported: JPM beat, BAC missed, WFC inline"
4. **Multi-Company Tweets**: Social media posts mentioning multiple tickers
5. **Event Analysis**: "MSFT-ATVI merger impacts: MSFT -1%, ATVI +15%, SONY -2%"

---

**Implementation Date**: 2026-07-02  
**Modified Files**:
- `src/shared/api/ollama.ts` - Multi-company prompt and array response
- `src/app/api/analyze/route.ts` - Loop over multiple results
- `src/components/SyncButton.tsx` - UI to display analysis list

---

## Implementation Notes

**Status**: ✅ Feature successfully implemented and verified in production

**Current Verification** (2026-07-17):
- ✅ Multi-company detection working with Groq API
- ✅ Array-based response preserved: `AnalysisResult[]`
- ✅ Loop processing in `/api/analyze` route unchanged
- ✅ UI displays multiple analyses correctly
- ✅ 233 tests passing (including multi-company scenarios)

**Key Changes Since Original Documentation**:

1. **LLM Provider Changed** (2026-07-16):
   - **Original**: Local Ollama (`llama-3.1-8b-instant`)
   - **Current**: Cloud Groq API (`llama-3.3-70b-versatile`)
   - **File**: `ollama.ts` → `llm.ts` (renamed to reflect provider-agnostic approach)

2. **Temperature Settings**:
   - Detection phase: `temperature: 0` (deterministic)
   - Analysis phase: `temperature: 0.3` (reduced from 0.7 for consistency)

3. **Component Changes**:
   - **Original**: `SyncButton.tsx` displayed analysis list
   - **Current**: `AnalyzeTextForm.tsx` in dedicated `/analyze` page (migrated 2026-07-04)

4. **Architecture Improvements**:
   - ✅ 2-phase LLM approach: `detectCompanies()` then `analyzeWithFinancials()`
   - ✅ Financial enrichment: Each analysis includes Finnhub snapshot (added 2026-07-16)
   - ✅ Job queue system: Analysis runs asynchronously with PENDING/PROCESSING/COMPLETED statuses

**All Core Functionality Preserved**:
- ✅ Single text input → multiple company detections
- ✅ Individual sentiment per company (BULLISH/BEARISH/NEUTRAL)
- ✅ Individual reliability scores (1-10)
- ✅ Specific reasoning per company
- ✅ Aggregate scores updated for each company
- ✅ No limit on number of companies detected

**Example Still Valid**: 
- Input: "AAPL +5% while MSFT -2%"
- Output: 2 analyses (AAPL BULLISH, MSFT BEARISH) ✅

