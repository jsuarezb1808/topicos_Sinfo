# Gasto público de Medellín por categoría (2015–2025)
### Análisis de contratos SECOP II + buscador conversacional con LLM

**Buscador:** https://topicos-sinfo.vercel.app  
**Backend:** https://github.com/latincrow81/api_sisinfo_cecop

**Equipo:** Mauricio Escudero · Jhesid Suarez · Juan Salas · Laura Marin
---

## Problema y usuario

Colombia publica todos sus contratos públicos en SECOP II. Medellín tiene más de 43 000 contratos registrados desde 2015. Esa información es técnicamente abierta, pero en la práctica es inaccesible para la mayoría de personas que tendrían razones legítimas para usarla.

**¿A quién le sirve?**

Hay tres perfiles principales, con necesidades distintas pero el mismo obstáculo de fondo:

El primero es el periodista o veedor ciudadano. Quiere saber si el gasto en movilidad creció después de la aprobación del metro, o si los contratos de seguridad aumentaron en años de elecciones. Hoy tiene que descargar CSVs manualmente, unirlos por año, limpiar inconsistencias de nombres de entidad y construir una tabla en Excel antes de poder hacer una sola gráfica. Ese proceso toma entre medio día y un día completo, y se repite cada vez que cambia la pregunta.

El segundo es el investigador de política pública o funcionario de planeación. Necesita comparar cómo han evolucionado las prioridades de inversión entre administraciones, o identificar si una categoría de gasto está concentrada en pocas entidades contratantes. Los portales de transparencia de la Alcaldía publican cifras presupuestales agregadas por vigencia, pero no desagregadas por categoría semántica ni con continuidad histórica entre planes de desarrollo.

El tercero es la PYME o proveedor del Estado que quiere entender el mercado antes de invertir tiempo en preparar una propuesta. ¿Cuántos contratos de mantenimiento TI saca la Alcaldía por año? ¿Cuál es el rango típico de presupuesto? ¿Qué entidades contratan más en su sector? Hoy no hay forma de responder esas preguntas sin construir la base de datos desde cero.

**¿En qué momento concreto lo usan?**

El periodista lo usa al inicio de una investigación, cuando todavía está viendo si hay historia. El investigador lo usa cuando prepara un informe de gestión o un paper y necesita series de tiempo limpias. La PYME lo usa antes de decidir si vale la pena preparar una propuesta para un proceso que acaba de aparecer en SECOP.

En los tres casos el momento crítico es el mismo: antes de comprometer horas de trabajo en algo que puede no tener sustento en los datos.

**¿Por qué hoy no está resuelto?**

SECOP II tiene un buscador, pero es por palabras exactas, no semántico, y no tiene ninguna visualización temporal. El portal de datos abiertos del DNP tiene el dataset crudo, pero requiere saber construir queries Socrata y procesar JSON paginado. Los portales de transparencia de la Alcaldía publican cifras presupuestales por vigencia pero no por categoría de contrato ni con continuidad entre administraciones.

La brecha no es de datos — los datos existen y son públicos. Es de herramienta: nadie ha construido la capa que convierte 43 000 filas de JSON en una línea de tiempo legible y un buscador que entiende lenguaje natural. Ese es exactamente el problema que resuelve este proyecto.

---

## Dataset

**Fuente:** API pública SECOP II — dataset `p6dx-8zbt`, endpoint Socrata del DNP  
`https://www.datos.gov.co/resource/p6dx-8zbt.json`

**Descarga:**  
El worker de ingestión pagina el endpoint filtrando por `municipio = Medellín` hasta agotar resultados. El campo de referencia temporal es `fecha_ultima` (fecha de última modificación del contrato en SECOP). La marca de agua (`watermark.last_fecha_ultima`) avanza con cada corrida y se persiste en Turso para que los runs siguientes solo traigan novedades.

```bash
# Backfill inicial (sin filtro de fecha):
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://secop-ingest.<account>.workers.dev/admin/backfill?since="

# Corrida incremental (usa la marca de agua guardada):
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://secop-ingest.<account>.workers.dev/admin/backfill"
```

El dataset más antiguo disponible tiene fecha de inicio de contrato en 2015; no hay registros anteriores en la fuente. Con ~2 200 contratos abiertos al momento del primer backfill y ~3 000 contratos/mes en estado activo, 10 años representan un universo de ~43 000 filas tras limpieza.

**Limpieza y decisiones de muestreo:**

- Cada fila pasa por un normalizador antes de hacer upsert en Turso. Se descartan contratos con `valor_contrato = 0` o nulo y se colapsan variantes del nombre de entidad con y sin tilde.
- Los batches crudos se archivan comprimidos en R2 (`raw/dt=YYYY-MM-DD/`) antes de normalizar, lo que permite replay completo sin volver a llamar a Socrata.
- Para el índice vectorial se usa el universo completo; no hay muestreo. El campo `descripcion_del_proceso` es el insumo de los embeddings y del resumen generado por IA.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        Usuario (browser)                        │
│                                                                 │
│   [Dashboard: gráficas temporales por categoría 2015-2025]      │
│   [Buscador semántico + resumen por contrato]                   │
│   [Gestión de alertas por correo]                               │
└──────────┬────────────────────────────────────┬─────────────────┘
           │ GET /v1/search, /v1/tenders/:id     │ POST /v1/alerts
           │ GET /v1/sectors, /v1/facets          │ GET  /v1/alerts/verify
           ▼                                      ▼
┌──────────────────────────────────────────────────────────────┐
│                  workers/api  (CF Worker)                    │
│                                                              │
│  • Búsqueda semántica: embed(query) → ANN sobre idx_vec      │
│  • Lectura de contratos enriquecidos                         │
│  • CRUD de alertas (magic-link verify, HMAC tokens)          │
│  • /v1/health, /v1/openapi.yaml, /admin/stats                │
└──────────────────┬───────────────────────────────────────────┘
                   │ libSQL (HTTP)
                   ▼
┌──────────────────────────────────────────────────────────────┐
│           Turso DB  (libSQL — SQLite-compatible)             │
│                                                              │
│  tenders     — filas normalizadas + embeddings F32 + JSON    │
│  alerts      — suscripciones verificadas por magic-link      │
│  watermark   — última fecha_ultima procesada por ingest      │
│  ai_usage    — neurons gastados por día (presupuesto CF AI)  │
│  kv          — flags operacionales (ej: alerts.disabled)     │
│                                                              │
│  idx_tenders_vec  — libsql_vector_idx(embedding) ANN        │
└──────┬──────────────────┬────────────────────────┬──────────┘
       │                  │                         │
       ▼                  ▼                         ▼
┌────────────┐   ┌─────────────────┐   ┌─────────────────────┐
│workers/    │   │ workers/enrich  │   │ workers/match       │
│ingest      │   │ (CF Worker)     │   │ (CF Worker)         │
│            │   │                 │   │                     │
│ • Pagina   │   │ • Lee tenders   │   │ • Cada 6h lee       │
│   Socrata  │   │   sin embedding │   │   alertas verified  │
│ • Archiva  │   │ • bge-m3 embed  │   │ • ANN match por     │
│   raw en   │   │ • Genera        │   │   alert query       │
│   Linode   │   │   summary_es    │   │ • Agrupa hits por   │
│ • Upsert   │   │   (Workers AI)  │   │   email, dedup      │
│   Turso    │   │ • Respeta       │   │ • Envía digest via  │
│ • Avanza   │   │   budget 8k     │   │   Resend (1/email   │
│   watermark│   │   neurons/día   │   │   /día)             │
└────────────┘   └─────────────────┘   └─────────────────────┘
       │
       ▼
┌──────────────────┐
│ Linode Object    │
│ Storage          │
│                  │
│ raw gz por       │
│ página (~1k rows)│
└──────────────────┘
```

**Flujo de datos:**

1. `workers/ingest` (cron cada 6h) descarga Socrata → archiva en Linode Object Storage → upsert en `tenders` → avanza `watermark`.
2. `workers/enrich` (cron cada 6h, tras ingest) lee filas sin `embedding`, genera vector con `bge-m3` y `summary_es` con `llama-3.1-8b-instruct`, ambos vía Cloudflare Workers AI. Respeta presupuesto de 8 000 neurons/día registrado en `ai_usage`.
3. `workers/api` sirve búsqueda semántica (embed del query → ANN sobre `idx_tenders_vec`) y gestiona alertas con magic-link y tokens HMAC.
4. `workers/match` (cron cada 6h) evalúa alertas verificadas contra los contratos nuevos/modificados y envía un digest diario por Resend.

---

## Decisiones de stack

| Componente | Elegido | Alternativa obvia | Por qué se eligió |
|---|---|---|---|
| Runtime | Cloudflare Workers (x4) | Servidor en Railway / Fly | Sin servidor que gestionar; escala a cero; los crons, Workers AI y los bindings de Turso están en la misma plataforma. |
| Base de datos | Turso (libSQL sobre SQLite) | PlanetScale / Supabase / Postgres | SQLite tiene extensión nativa de vectores (`libsql_vector_idx`); Turso lo expone por HTTP desde Workers sin driver extra. Todo en un solo servicio. |
| Vector index | `libsql_vector_idx` (Turso nativo) | Pinecone / FAISS / pgvector | Cero servicios adicionales: el índice ANN vive en la misma DB que los metadatos. Para el volumen del proyecto (~43k filas) la latencia es adecuada. |
| Embeddings + generación | Cloudflare Workers AI (`bge-m3`) | OpenAI `text-embedding-3-small` | Cero egress cost; el modelo corre en la misma red que los Workers. Restricción: 8 000 neurons/día en el plan gratuito, lo que impone el backfill gradual de 3 días. |
| Email | Resend | SendGrid / SES | API mínima, DKIM/DMARC sencillo. Free tier: 100 correos/día, suficiente para la fase de prototipo. |
| Almacenamiento raw | Linode Object Storage (S3-compatible) | Cloudflare R2 / S3 | Entra en el free tier del plan de Linode que ya usaba el equipo. Un objeto por página de Socrata (~1 000 filas), no por fila, lo que mantiene el número de operaciones Class A bajo. |
| Autenticación de alertas | HMAC tokens (magic-link, no contraseña) | Auth0 / Supabase Auth | El único dato de identidad del usuario es su email; no tiene sentido añadir un proveedor de auth completo para un flujo de suscripción. |
| Schema validation | Zod (schemas.ts) + openapi.yaml generado | Joi / manualmente | El YAML de OpenAPI se genera desde los mismos schemas Zod que validan los requests; no hay drift posible entre documentación y código. |

---

## IA

### Embeddings (enrich worker)

**Modelo:** `bge-m3` vía Cloudflare Workers AI  
**Dónde corre:** en la red de Cloudflare, sin egress desde el worker  
**Dimensión del vector:** definida en `shared/src/ai.ts` → constante `EMBED_DIM` (actualmente 1024)  
**Costo:** el plan gratuito de Workers AI otorga 8 000 neurons/día. Cada llamada de embedding consume ≈ 11 neurons (constante `NEURONS_PER_EMBED_CALL` en `shared/src/ai.ts`). Con ese presupuesto el worker procesa ~720 filas/día. El backfill inicial de ~2 200 filas tarda ~3 días al ritmo natural del cron de 6h.

**Costo estimado en producción pagada** (Workers AI Unbound: USD 0.011/1k neurons): backfill completo de 43k contratos ≈ 473k neurons ≈ **USD 5.20 one-time**. Ingesta mensual de ~3 000 contratos nuevos: ~33k neurons ≈ **USD 0.36/mes**.

### Resúmenes (enrich worker)

**Modelo:** `llama-3.1-8b-instruct` vía Cloudflare Workers AI  
**Estrategia:** prompt en `shared/src/ai.ts` con la descripción del proceso, entidad, modalidad y valor. Salida JSON (`summary_es`) que el frontend consume directamente.  
**Budget guard:** el worker lee `ai_usage` al inicio de cada batch y para anticipadamente si el gasto del día supera el tope. `NEURONS_PER_SUMMARY_CALL` en `shared/src/ai.ts` es el estimado conservador; si el consumo real diverge, se ajusta esa constante y se redeploya.

### Búsqueda semántica (api worker)

**Estrategia:** el query del usuario se embede con `bge-m3` → `vector_top_k('idx_tenders_vec', :qvec, 200)` en Turso → JOIN con `tenders` para aplicar filtros de UNSPSC, valor, modalidad → top-k resultados con score de similitud coseno. No hay generación adicional en el path de búsqueda; el LLM solo intervino offline para producir los `summary_es` que se sirven estáticos.

---

## Lo que no funcionó y lo que quedó pendiente

### Descartado

**SQL Agent como capa de respuesta:** se intentó un agente con acceso a Turso para responder preguntas de conteo y suma exacta. Generaba SQL incorrecto en ~35% de preguntas con ambigüedad semántica ("movilidad" puede mapear a varias categorías según el contrato). Se descartó por tiempo; sería la mejora más impactante para preguntas numéricas.

**Actualización del vector index en background inmediato:** la primera idea era que el upsert de ingest disparara el embedding en la misma request. Turso no soporta triggers en la capa HTTP y el tiempo de CPU de un Worker no aguanta procesar N filas de embeddings síncronamente. Se separó en worker dedicado con cron propio.

**Clasificación batch con LLM externo:** se evaluó clasificar contratos por categoría con un modelo generativo antes de persistir. El presupuesto de neurons del plan gratuito no alcanza para correrlo junto con los embeddings. Se postergó; por ahora la asignación de categoría se hace por reglas sobre el código UNSPSC que ya viene en el dato fuente.

### Pendiente

- **Clasificación semántica de categorías:** hoy se usa el segmento UNSPSC. Una clasificación LLM sobre `descripcion_del_proceso` daría categorías más limpias para las gráficas temporales, especialmente para contratos con UNSPSC mal diligenciado.
- **SQL Agent como fallback para preguntas numéricas exactas:** ver arriba.
- **Wipe-and-rebuild desde R2:** el runbook describe el flujo conceptual pero el script que reproduce los batches archivados en R2 a través del normalizador está marcado como TBD. Sin él, un desastre de Turso requiere volver a llamar a Socrata.
- **Tests:** cobertura cero de tests unitarios. El código de normalización y el presupuesto de neurons deberían tener al menos tests de contrato antes de ir a producción.

---

## Métricas

| Métrica | Valor |
|---|---|
| Latencia p50 `/v1/search` (embed + ANN, red local) | ~1.8 s |
| Latencia p95 `/v1/search` | ~4.1 s |
| Costo por consulta en producción (embed query + lectura top-k) | ≈ USD 0.0001 (11 neurons × $0.011/1k) |
| Costo backfill completo 43k contratos (Workers AI Unbound) | ≈ USD 5.20 one-time |
| Costo mensual ingesta incremental ~3k contratos/mes | ≈ USD 0.36/mes |
| Resend free tier | 100 emails/día, 3k/mes |
| Tiempo backfill inicial (plan gratuito 8k neurons/día) | ~3 días al ritmo natural del cron |

---

## Cómo correrlo en local

**Requisitos:** Node 20+, Turso CLI, cuenta de Cloudflare con Workers AI habilitado, cuenta de Resend.

```bash
# 1. Instalar dependencias y crear la base de datos
brew install tursodatabase/tap/turso   # una vez
turso auth login
turso db create secop --location iad
turso db shell secop < migrations/0001_init.sql
turso db shell secop < migrations/0002_ai_usage.sql
turso db shell secop < migrations/0003_kv.sql

# 2. Copiar variables de entorno y completarlas
cp .env.example .env
# Editar .env: TURSO_URL (libsql://...), TURSO_TOKEN, RESEND_API_KEY, SOCRATA_APP_TOKEN (opcional)

# 3. Instalar dependencias de todos los workers
npm install   # desde la raíz del monorepo (workspaces)

# 4. Publicar secretos y desplegar el worker de API
cd workers/api
echo "$TURSO_URL"   | npx wrangler secret put TURSO_URL
cat ../../.turso-token | npx wrangler secret put TURSO_TOKEN
openssl rand -base64 48 | npx wrangler secret put HMAC_SECRET
echo "$RESEND_API_KEY"  | npx wrangler secret put RESEND_API_KEY
npx wrangler deploy

# 5. Verificar y lanzar el backfill inicial
curl https://secop-api.<account>.workers.dev/v1/health
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://secop-ingest.<account>.workers.dev/admin/backfill?since="
```

Para desplegar los workers de ingest, enrich y match ver los pasos completos de cada fase en [RUNBOOK.md](./RUNBOOK.md).

### Frontend

```bash
cd web
cp .env.example .env.local   # configurar NEXT_PUBLIC_API_BASE
npm install
npm run dev
```

Documentación de los endpoints que consume: `API.md`.

---

*Datos fuente: SECOP II — Departamento Nacional de Planeación, Colombia. Dominio público.*  
*Última actualización del dataset: mayo 2025.*
