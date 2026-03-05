# Alicia's Garden Web (`apps/web`)

Frontend de Alicia's Garden construido con Next.js (App Router) + TypeScript.

## Requisitos

- Node.js 20+
- npm 10+

## Configuracion de entorno

Este frontend consume el Worker por HTTP y necesita:

- `NEXT_PUBLIC_WORKER_URL`

Crea `apps/web/.env.local` con:

```env
NEXT_PUBLIC_WORKER_URL=http://127.0.0.1:8787
```

## Worker local vs produccion

- Local: usa la URL local del Worker (por ejemplo `http://127.0.0.1:8787`).
- Produccion: apunta al dominio desplegado del Worker (por ejemplo `https://<tu-worker>.workers.dev`).

Solo cambia `NEXT_PUBLIC_WORKER_URL` en `.env.local` para alternar entre entornos.

## Desarrollo

Desde la raiz del repo:

```bash
npm -C apps/web run dev
```

La app queda disponible en `http://localhost:3000`.

## Scripts disponibles

```bash
npm -C apps/web run dev
npm -C apps/web run lint
npm -C apps/web run typecheck
npm -C apps/web run test
npm -C apps/web run test:watch
npm -C apps/web run build
npm -C apps/web run start
```

Notas:

- `test` ejecuta la suite de Vitest en modo CI (`vitest run`).
- `test:watch` ejecuta Vitest en modo interactivo.
- `build` valida compilacion de produccion y chequeo de tipos de Next.
