# ⚠️ OBSOLETE - Plan de Internacionalización (i18n) — EN / ES

> **🚨 ESTE PLAN HA SIDO DESCARTADO**
> 
> **Fecha de Obsolescencia**: 2026-07-13
> 
> **Decisión Final**: La UI permanece en inglés (hardcoded). No hay sistema de traducción de interfaz.
> Solo existe traducción on-demand del análisis IA (inglés → español) mediante botón toggle en `EnrichmentDisplay`.
> 
> **Razón**: 
> - Requisito TFM: Interfaz en inglés, README en español
> - Simplificación del código: eliminar complejidad innecesaria de next-intl
> - Enfoque en lo esencial: traducción disponible donde importa (análisis IA interpretativo)
> 
> **Implementación Real**: Ver `src/entities/company/ui/EnrichmentDisplay.tsx` (botón EN/ES), 
> endpoint `/api/companies/[ticker]/enrich-finnhub/[id]/translate`, 
> y utilidad `src/shared/lib/translationCache.ts`.

---

# Plan de Internacionalización (i18n) — EN / ES

**Estado**: ❌ **OBSOLETO** - No implementar
**Fecha**: 2026-07-04 (descartado 2026-07-13)
**Objetivo Original**: Portal bilingüe Inglés / Español con traducción gratuita.

---

## 0. Decisiones tomadas

| Decisión | Elección | Motivo |
|----------|----------|--------|
| Estrategia de URL | **Sin prefijo** — idioma en cookie/localStorage | No cambia las rutas existentes ni el middleware de auth |
| Traducción de contenido IA (`reasoning`) | **Ollama (ya instalado)** | Ya está en Docker, gratis, local, sin dependencias extra |
| Librería i18n | **next-intl** (modo *without i18n routing*) | Mejor soporte para App Router; sin conflicto con middleware |

> ⚠️ **Nota Next.js 16**: Esta versión tiene cambios importantes respecto a versiones previas.
> Antes de escribir código, consultar `node_modules/next/dist/docs/` y la guía de
> `next-intl` para el modo *without i18n routing* (App Router).

---

## 1. Los dos frentes de traducción

| Tipo | Ejemplos en MarketWhisper | Cómo se traduce |
|------|---------------------------|-----------------|
| **UI estática** | Menú lateral, botones, labels de formularios, títulos (`Companies`, `Analyze`, `Insights`) | Diccionarios `en.json` / `es.json` (next-intl) |
| **Contenido dinámico** | El `reasoning` del análisis de IA, descripciones enriquecidas | Ollama genera directo en el idioma del usuario (prompt con locale) |

---

## 2. Arquitectura elegida: next-intl SIN routing por URL

En el modo *without i18n routing*, **no** se crean carpetas `app/[locale]/` ni se
añade middleware de i18n. El idioma se resuelve desde una **cookie** (`NEXT_LOCALE`).
Esto evita tocar el middleware de auth existente en `src/middleware.ts`.

### Estructura de archivos (encaja con FSD)

```
src/
  i18n/
    request.ts          # Lee la cookie NEXT_LOCALE y carga el JSON correspondiente
    config.ts           # locales: ['en','es'], defaultLocale: 'en'
  messages/
    en.json             # Diccionario inglés (fuente de la verdad)
    es.json             # Diccionario español (generado + revisado)
  features/
    switch-locale/      # NUEVO feature FSD: acción de cambiar idioma
      index.ts
      ui/
        LocaleSwitcher.tsx
      api/
        set-locale.ts   # Server Action que escribe la cookie NEXT_LOCALE
```

### Puntos de integración

- `src/app/layout.tsx`: envolver con `NextIntlClientProvider` y pasar `messages` + `locale`.
- `src/widgets/header/ui/Header.tsx`: montar el `LocaleSwitcher`.
- `next.config.ts`: añadir el plugin `createNextIntlPlugin()`.

---

## 3. Traducción del contenido dinámico con Ollama

**Ventaja clave**: Ollama ya está en tu `docker-compose.yml`, sin añadir servicios extra.

### 3.1 Estrategia: Generar directo en el idioma del usuario

En lugar de traducir después, modificar el **prompt de análisis** para que Ollama
genere el `reasoning` directamente en el idioma solicitado.

**Archivo a modificar**: `src/shared/api/ollama.ts` (o donde llames a Ollama)

```typescript
export async function analyzeTextWithOllama(
  text: string, 
  locale: 'en' | 'es' = 'en'
): Promise<AnalysisResult[]> {
  const languageInstruction = locale === 'es' 
    ? 'Responde en español.' 
    : 'Respond in English.';

  const prompt = `${languageInstruction}

Analyze the following text and detect ALL companies mentioned...
${text}`;

  // ... resto de la llamada a Ollama
}
```

### 3.2 ¿Y si ya tienes análisis antiguos en inglés?

Dos opciones:

- **A) Traducción bajo demanda (simple)**: Cuando el usuario está en `es` y el
  `reasoning` está en inglés, llamar a Ollama con un prompt de traducción:
  
  ```typescript
  // src/shared/api/ollama.ts
  export async function translateWithOllama(
    text: string,
    target: 'en' | 'es'
  ): Promise<string> {
    const prompt = target === 'es'
      ? `Translate the following text to Spanish:\n\n${text}`
      : `Translate the following text to English:\n\n${text}`;
    // ... llamada a Ollama
  }
  ```

- **B) Cachear en BD**: Añadir `reasoningEs` al modelo `Analysis` y traducir
  una vez (requiere migración Prisma).

> **Recomendación**: empezar con **A** (traducción bajo demanda), solo afecta
> al frontend. Migrar a **B** si el volumen crece.

---

## 4. Fases de implementación

| Fase | Tarea | Archivos afectados |
|------|-------|--------------------|
| 1 | Instalar `next-intl`, crear `i18n/config.ts` + `i18n/request.ts`, plugin en `next.config.ts` | `package.json`, `next.config.ts`, `src/i18n/*` |
| 2 | Crear `messages/en.json` extrayendo textos hardcodeados | `src/messages/en.json` |
| 3 | Envolver `app/layout.tsx` con `NextIntlClientProvider` | `src/app/layout.tsx` |
| 4 | Feature `switch-locale` + `LocaleSwitcher` en el Header | `src/features/switch-locale/*`, `src/widgets/header/ui/Header.tsx` |
| 5 | Sustituir textos por `useTranslations()` en widgets/features/entities | Múltiples `ui/*.tsx` |
| 6 | Generar `es.json` con Ollama + revisión manual | `src/messages/es.json` |
| 7 | Modificar llamadas a Ollama para aceptar `locale` como parámetro | `src/shared/api/ollama.ts` (o similar) |
| 8 | Pasar `locale` desde componentes que usan análisis IA | Componentes que llaman a `analyzeText()` |
| 9 | Tests: unit del `LocaleSwitcher` + e2e de cambio de idioma | `*.test.tsx`, `e2e/*.spec.ts` |

---

## 5. Inventario de textos a traducir (a completar en Fase 2)

Rastrear textos hardcodeados en:

- `src/widgets/sidebar/` — items de navegación (Dashboard, Companies, Insights…)
- `src/widgets/header/ui/Header.tsx` — botones (Analyze, Logout…)
- `src/features/analyze-text/ui/` — formulario y resultados
- `src/features/auth/ui/`, `src/app/(auth)/login`, `register` — login/registro
- `src/features/company-search/ui/` — búsqueda y estados vacíos
- `src/entities/company/ui/`, `src/entities/analysis/ui/` — cards y etiquetas
- `src/app/companies/[ticker]`, `src/app/insights`, `src/app/situations` — páginas

Organizar el JSON por *namespaces* (ej. `nav`, `auth`, `analyze`, `company`, `common`).

---

## 6. Coste y dependencias

| Recurso | Coste | Nota |
|---------|-------|------|
| `next-intl` | Gratis (npm) | ~1 dependencia |
| Ollama | Gratis (ya instalado) | Sin dependencias extra, ya está en Docker |
| Ollama (para generar `es.json` una vez) | Gratis | Solo en desarrollo, no en runtime |

**Coste total en producción: 0 €** (todo self-hosted / free tier).
**RAM adicional: 0 GB** (Ollama ya está corriendo).

---

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Ollama puede ser lento traduciendo (500ms-2s) | Opción B: cachear en BD; mostrar spinner mientras traduce |
| Calidad de traducción de Ollama con modelos pequeños | Usar `llama3:8b` o superior; revisar output; cachear corregido |
| Textos que quedan sin extraer | Fase 5 exhaustiva + revisión visual en ambos idiomas |
| Cambio de idioma sin recargar contenido dinámico | El `LocaleSwitcher` debe refrescar (router.refresh) tras set-cookie |

---

## 8. Próximo paso sugerido

Empezar por la **Fase 1** (setup de `next-intl`) que es aislada y no rompe nada
existente, validar que compila, y luego avanzar fase a fase manteniendo la
disciplina de tests del proyecto.
