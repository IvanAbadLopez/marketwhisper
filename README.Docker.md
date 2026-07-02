# MarketWhisper - Docker Setup

Este archivo explica cómo ejecutar MarketWhisper usando Docker, sin necesidad de instalar Node.js, PostgreSQL, ni otras dependencias.

## Requisitos Previos

- **Docker Desktop** instalado ([descargar aquí](https://www.docker.com/products/docker-desktop))
- **Git** (para clonar el repositorio)

## Inicio Rápido

### 1. Clonar el Repositorio

```bash
git clone https://github.com/IvanAbadLopez/marketwhisper.git
cd marketwhisper
```

### 2. Configurar Variables de Entorno (Opcional)

Si quieres usar OAuth o APIs externas, crea un archivo `.env` en la raíz del proyecto:

```bash
# Copiar ejemplo
cp .env.example .env

# Editar con tus credenciales (opcional)
# Las variables vacías usarán valores por defecto para desarrollo
```

**Nota**: Para el modo demo, NO necesitas configurar nada. La aplicación funcionará con el usuario de demostración.

### 3. Iniciar la Aplicación

```bash
docker compose up
```

Este comando:
- Descarga las imágenes de Docker necesarias
- Crea una base de datos PostgreSQL con pgvector
- Construye la aplicación Next.js
- Inicia todos los servicios

**Primera vez**: Puede tardar 3-5 minutos en construir todo.

### 4. Acceder a la Aplicación

Abre tu navegador en: **http://localhost:3000**

**Credenciales de demo:**
- Email: `demo@marketwhisper.com`
- Password: `demo1234`

## Comandos Útiles

### Detener la aplicación
```bash
docker compose down
```

### Detener y eliminar datos
```bash
docker compose down -v
```

### Ver logs
```bash
docker compose logs -f web
```

### Reconstruir después de cambios en código
```bash
docker compose up --build
```

### Ejecutar scripts de Python (scraping, etc.)

Los scripts de Python deben ejecutarse desde tu máquina local, ya que requieren:
- Playwright con navegador instalado
- Acceso a las credenciales de blogs (en `.env.local`)
- Opcionalmente: Whisper con GPU para transcripción

```bash
# Asegúrate de tener Python 3.12+ y las dependencias instaladas
pip install -r scripts/requirements.txt

# Ejemplo: scraping de URL
python scripts/scrape_url.py https://example.com "Example Source" --type WEB_ARTICLE
```

## Estructura de Servicios

```
┌─────────────────────────────────────┐
│  localhost:3000                     │
│  Next.js Web App                    │
│  (Frontend + API Routes)            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  db:5432                            │
│  PostgreSQL + pgvector              │
│  (Base de datos)                    │
└─────────────────────────────────────┘
```

## Datos Persistentes

Los datos de la base de datos se guardan en un **volumen de Docker** llamado `postgres_data`. Esto significa que:

- ✅ Los datos persisten aunque detengas los contenedores
- ✅ Puedes hacer `docker compose down` sin perder información
- ❌ `docker compose down -v` SÍ borrará todos los datos

## Poblar la Base de Datos

Para agregar empresas y contenido de ejemplo:

```bash
# Desde tu máquina local (con Python instalado)
python scripts/seed_companies.py
python scripts/seed_content.py
```

O accede a la aplicación web y usa el botón "Sync Now" para agregar contenido mediante scraping.

## Solución de Problemas

### Puerto 3000 ya en uso
```bash
# Cambiar puerto en docker-compose.yml
ports:
  - "3001:3000"  # Ahora accesible en localhost:3001
```

### Puerto 5432 ya en uso (tienes Postgres instalado)
```bash
# Cambiar puerto en docker-compose.yml
ports:
  - "5433:5432"  # Cambiar también DATABASE_URL
```

### Limpiar todo y empezar de cero
```bash
docker compose down -v
docker system prune -a
docker compose up --build
```

### Ver estado de los contenedores
```bash
docker compose ps
```

## Para Producción

Este setup es para **desarrollo/evaluación**. Para producción:

1. Cambiar `NEXTAUTH_SECRET` por uno generado con:
   ```bash
   openssl rand -base64 32
   ```

2. Usar PostgreSQL gestionado (Neon, Supabase, etc.)

3. Configurar HTTPS y dominio real

4. Activar OAuth con credenciales reales

5. Desplegar en:
   - **Vercel** (Frontend)
   - **Railway/Fly.io** (Full-stack con Docker)
   - **AWS ECS/Google Cloud Run** (Contenedores)

## Soporte

Si encuentras problemas:
1. Revisa los logs: `docker compose logs -f`
2. Asegúrate de que Docker Desktop esté corriendo
3. Verifica que los puertos 3000 y 5432 estén libres
4. Consulta la documentación en `README.md`
