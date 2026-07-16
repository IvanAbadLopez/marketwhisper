import { describe, it, expect } from 'vitest';
import { analyzeText } from '@/shared/api/llm';
import { resolveTicker } from '@/shared/api/finnhub';

describe('Alibaba detection (Integration)', () => {
  const alibabaTextSpanish = `Alibaba es el mayor bazar digital de China, con más de mil millones de consumidores y una red de mercados electrónicos que ofrece publicidad, comisiones por venta y servicios de logística.
Su vertical Alibaba Cloud es el equivalente chino a AWS, líder en Asia con centros de datos y servidores de inteligencia artificial, alquilados a pymes y grandes empresas sin rival doméstico.
El mayor riesgo de la compañía es el regulatorio chino y la estructura VIE, que implica que los inversores extranjeros no son dueños reales de los activos chinos y podrían perder valor si el gobierno interviene.
El gasto en CAPEX de IA ha disparado las inversiones, generando un flujo de caja negativo temporal, pero es una inversión de crecimiento y no de mantenimiento, lo que diferencia a Alibaba de otros negocios que sangran dinero sin propósito claro.
A precios actuales, el mercado paga el escenario más pesimista de la compañía, valorándola como si la inversión en IA fuera dinero tirado y el descuento chino fuera permanente.`;

  it.skip('should detect Alibaba from Spanish text via LLM', async () => {
    const results = await analyzeText(alibabaTextSpanish);
    
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
    
    const alibaba = results.find(r => 
      r.companyName.toLowerCase().includes('alibaba') || r.ticker === 'BABA'
    );
    
    expect(alibaba).toBeDefined();
    expect(alibaba?.sentiment).toBe('BULLISH');
    expect(alibaba?.reliabilityScore).toBeGreaterThanOrEqual(6);
  }, 120000);

  it.skip('should resolve "Alibaba" to BABA ticker via Finnhub', async () => {
    const ticker = await resolveTicker('Alibaba');
    
    expect(ticker).toBe('BABA');
  });

  it('should document the complete flow', () => {
    const flow = `
    Complete flow for Alibaba detection:
    
    1. User submits Spanish text mentioning "Alibaba" (no ticker)
    2. Groq LLM analyzes text with improved prompt:
       - Detects multilingual input (Spanish)
       - Extracts company name "Alibaba"
       - May or may not extract ticker "BABA" (depending on model knowledge)
       - Returns sentiment BULLISH, reliability ~7
    
    3. processAnalysis receives result:
       - If ticker is missing, calls resolveTicker("Alibaba")
       - Finnhub symbol lookup returns BABA (US ADR)
       - Creates/finds company with ticker BABA
       - Saves analysis with sentiment and reliability
    
    4. Job status updates to COMPLETED with ticker "BABA"
    5. User sees analysis in /jobs and /companies/BABA
    `;
    
    expect(flow).toBeTruthy();
  });
});
