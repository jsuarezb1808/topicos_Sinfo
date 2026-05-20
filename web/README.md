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

## Scripts

- `npm run dev` — desarrollo
- `npm run build` — build de producción
- `npm run start` — servidor de producción local
