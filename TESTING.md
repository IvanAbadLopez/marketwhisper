# Testing Guide

## Test Suites

MarketWhisper incluye dos tipos de testing:

### 1. Unit & Integration Tests (Vitest)

Tests rápidos para componentes, utilidades y lógica de negocio.

**Ejecutar tests:**
```bash
npm test              # Watch mode
npm test -- --run     # Single run
npm run test:ui       # UI interactiva
npm run test:coverage # Con cobertura
```

**Archivos de test:**
- `src/**/*.test.ts(x)` - Tests unitarios/integración
- `vitest.config.ts` - Configuración Vitest
- `vitest.setup.ts` - Setup global

**Tests actuales:**
- ✅ Header component rendering
- ✅ Password hashing (bcrypt)
- ✅ Email validation
- ✅ Password strength requirements

---

### 2. E2E Tests (Playwright)

Tests end-to-end que simulan interacción real del usuario.

**Ejecutar tests E2E:**
```bash
npm run test:e2e           # Ejecutar tests
npm run test:e2e:ui        # Modo UI interactivo
npm run test:e2e:report    # Ver reporte HTML
```

**Archivos de test:**
- `e2e/*.spec.ts` - Tests E2E
- `playwright.config.ts` - Configuración Playwright

**Tests actuales:**
- ✅ Login con credenciales demo
- ✅ Logout flow
- ✅ Error handling (credenciales inválidas)
- ✅ Protected routes (redirección a /login)
- ✅ Navegación login → register

---

## Estructura de Testing

```
marketwhisper/
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   └── Header.test.tsx      # Component tests
│   └── lib/
│       ├── auth.ts
│       └── auth.test.ts         # Unit tests
├── e2e/
│   └── auth.spec.ts             # E2E tests
├── vitest.config.ts
├── vitest.setup.ts
└── playwright.config.ts
```

---

## CI/CD

Los tests se ejecutan automáticamente en GitHub Actions:

- ✅ Lint + Type check
- ✅ Build
- ✅ Unit tests (Vitest)
- ⏸️ E2E tests (deshabilitados por defecto)

### Habilitar E2E tests en CI

Los tests E2E están deshabilitados en CI porque requieren una base de datos. Para habilitarlos:

1. **Crear un proyecto Neon separado para CI** (gratis)
2. **Añadir secret en GitHub**: Settings → Secrets → `DATABASE_URL_CI`
3. **Habilitar el job en `.github/workflows/ci.yml`**:
   ```yaml
   e2e-tests:
     if: true  # Cambiar de false a true
   ```

El CI ejecutará:
- Unit tests en cada push/PR
- E2E tests solo en pushes a `main` (si están habilitados)

---

## Writing Tests

### Component Test Example (Vitest + Testing Library)

```typescript
import { render, screen } from "@testing-library/react";
import { MyComponent } from "./MyComponent";

test("renders correctly", () => {
  render(<MyComponent />);
  expect(screen.getByText("Hello")).toBeInTheDocument();
});
```

### E2E Test Example (Playwright)

```typescript
import { test, expect } from "@playwright/test";

test("user can login", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[type="email"]', "demo@marketwhisper.com");
  await page.fill('input[type="password"]', "demo1234");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/");
});
```

---

## Demo User

Para testing local, usa:
- **Email:** `demo@marketwhisper.com`
- **Password:** `demo1234`

Este usuario está seedeado en la base de datos Neon.
