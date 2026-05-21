# SECOP — Frontend (búsqueda semántica PYMES)

Interfaz web para el buscador semántico de licitaciones SECOP II: búsqueda por sector UNSPSC, resúmenes automáticos y alertas por correo.

## Requisitos

- Node.js 20+
- API desplegada (Cloudflare Worker). Ver `../API.md`.

## Configuración

```bash
cd web
cp .env.example .env.local
# Edita NEXT_PUBLIC_API_BASE con la URL del worker
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. **Root Directory:** `web`
3. Variable de entorno: `NEXT_PUBLIC_API_BASE` = URL del worker (sin barra final).
4. Los dominios `*.vercel.app` ya están permitidos en CORS del API.

Para un dominio propio, pide al operador que añada el origen en `ALLOWED_ORIGINS` del worker.

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Búsqueda semántica y filtros |
| `/licitaciones/[id]` | Detalle de licitación |
| `/alertas/verificar?token=` | Confirmar alerta (enlace manual o futuro email) |
| `/alertas/desuscribir?token=` | Baja de alerta |
| `/alertas/[id]` | Editar / eliminar alerta (token en localStorage) |

**Nota:** Los correos actuales enlazan directamente a `GET /v1/alerts/verify` en el worker (respuesta JSON). Para que el usuario vea esta UI, el backend debe apuntar los magic links a `https://tu-app.vercel.app/alertas/verificar?token=...`.

## Registro de peticiones al API

En la página de búsqueda, la sección **«Peticiones al backend»** (siempre visible) muestra por cada llamada:

- Método y ruta
- Fecha/hora
- Cuerpo del **request**
- **Response** del servidor (o error de red)

Al pulsar **Buscar** se limpia el historial y se registra el `POST /v1/search`. Los GET de catálogo (`/v1/sectors`, `/v1/facets`) aparecen al cargar la página hasta la primera búsqueda.

Con `NEXT_PUBLIC_API_DEBUG=true` o en `npm run dev`, lo mismo se imprime en la consola como `[SECOP API]`.

## Scripts

- `npm run dev` — desarrollo
- `npm run build` — build de producción
- `npm run start` — servidor de producción local
