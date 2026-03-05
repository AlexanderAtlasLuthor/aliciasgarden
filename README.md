# Alicia's Garden - Semana 1

## Estado de ejecucion actualizado (Plan + Progreso real)

---

# Vision de Semana 1

## Objetivo de la semana

Construir las **fundaciones completas del producto** para que exista una aplicacion funcional donde una unica usuaria (la suegra del creador) pueda:

- Abrir la aplicacion
- Navegar entre secciones principales
- Hablar con Toni (IA de jardineria)
- Guardar el historial del chat
- Crear plantas
- Ver su jardin
- Tener un dashboard simple

Todo esto **sin sistema de login**.

---

# Estado general del proyecto

| Area                       | Estado                    |
| -------------------------- | ------------------------- |
| Arquitectura               | ✅ Definida                |
| Backend Worker             | ✅ Mayormente implementado |
| Persistencia DB            | ✅ Funcionando             |
| API Plants                 | ✅ Completa                |
| Supabase CLI + Migraciones | ✅ Configurado             |
| Chat Toni                  | ❌ No iniciado             |
| Frontend Next.js           | ❌ No iniciado             |
| Deploy                     | ❌ No iniciado             |

Progreso estimado:

**Backend: ~90% completo**

---

# Decisiones de arquitectura (cerradas)

Estas decisiones eliminan complejidad innecesaria para esta app.

### Usuario unico

```txt
profile_id = "default_profile"
```

No existe autenticacion.

---

### Backend como BFF

El frontend **NO accede a Supabase directamente**.

Flujo:

```txt
Frontend
   ↓
Cloudflare Worker
   ↓
Supabase
```

Esto protege:

- service role key
- claves de IA

---

### Supabase

Usado para:

- Base de datos
- Storage

---

### IA

La IA vive **solo en el Worker**.

---

# 1. Repositorio y estructura

## Estado actual

Estructura principal del repo:

```txt
aliciasgarden
 ├ apps
 │  ├ worker
 │  └ web (pendiente)
 ├ supabase
 │  └ migrations
 └ package.json
```

---

# 2. Backend - Cloudflare Worker

## Objetivo

Construir un **Backend for Frontend (BFF)** que:

- encapsule la logica
- maneje la DB
- llame a la IA
- exponga endpoints simples al frontend

---

# Subfase A - Bootstrap del proyecto

## Objetivo

Inicializar el Worker y validar que corre localmente.

## Implementado

Carpeta:

```txt
apps/worker
```

### package.json

Dependencias:

- hono
- @supabase/supabase-js

Dev:

- typescript
- wrangler

---

### tsconfig

Configuracion:

```txt
target: ES2022
module: ESNext
strict: true
```

---

### wrangler.toml

Variables:

```txt
PROFILE_ID
CORS_ORIGIN
```

---

### Validacion

```txt
wrangler dev
```

Servidor levanta correctamente.

Estado:

✅ COMPLETADO

---

# Subfase B - Plumbing base

## Objetivo

Crear las utilidades base que usara toda la API.

---

## src/types/env.ts

Define:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
PROFILE_ID
CORS_ORIGIN
AI_API_KEY
```

---

## src/lib/supabase.ts

Cliente Supabase centralizado:

```txt
getSupabase(env)
```

Configuracion:

- service role
- sin persistSession

---

## src/lib/http.ts

Helpers HTTP:

```txt
jsonOk()
jsonError()
safeParseJson()
```

Formato estandar de respuesta:

```txt
{
 ok: true
}

{
 ok:false,
 error:{ code,message }
}
```

Estado:

✅ COMPLETADO

---

# Subfase C - Middleware global

## Objetivo

Infraestructura transversal.

---

## errors.ts

Captura errores y devuelve JSON consistente.

---

## cors.ts

Headers:

```txt
Access-Control-Allow-Origin
Access-Control-Allow-Methods
Access-Control-Allow-Headers
Access-Control-Allow-Credentials
```

Preflight:

```txt
OPTIONS -> 204
```

---

## rateLimit.ts

Placeholder:

```txt
60 requests/min
Map por IP
```

Error:

```txt
429 RATE_LIMITED
```

Estado:

✅ COMPLETADO

---

# Subfase D - Endpoint Health

Ruta:

```txt
GET /health
```

Respuesta:

```txt
{ ok: true }
```

Pruebas:

```txt
curl /health -> 200
OPTIONS /health -> 204
```

Estado:

✅ COMPLETADO

---

# Subfase E - API Plants

Endpoints:

```txt
GET /plants
POST /plants
```

---

## GET /plants

Query:

```txt
select *
from plants
where profile_id = env.PROFILE_ID
order by created_at desc
```

Respuesta:

```txt
jsonOk({ plants })
```

---

## POST /plants

Validacion:

```txt
nickname requerido
trim
```

Error:

```txt
400 VALIDATION_ERROR
```

Insert:

```txt
profile_id = env.PROFILE_ID
nickname
species_common
location
light
watering_interval_days
notes
```

Respuesta:

```txt
201 Created
```

Estado:

✅ COMPLETADO

---

# 3. Base de datos - Supabase

## Setup realizado

Supabase CLI configurado.

Version:

```txt
2.76.16
```

Proyecto linkeado:

```txt
supabase link --project-ref llykhzeuuwebmqjzkrkg
```

---

# Migraciones

Archivo:

```txt
supabase/migrations/20260305035241_init_schema.sql
```

Contiene:

- plants
- chat_threads
- chat_messages

---

# Migracion aplicada

```txt
supabase db push
```

Resultado:

Migracion aplicada correctamente.

---

# Verificacion

Tablas existentes:

```txt
plants
chat_threads
chat_messages
```

---

# Verificacion del Worker

### GET /plants

```txt
200 OK
{ plants: [] }
```

---

### POST /plants

```txt
201 Created
```

---

### GET /plants posterior

Devuelve la planta creada.

Persistencia confirmada.

Estado:

✅ COMPLETADO

---

# Backend actual

| Componente        | Estado |
| ----------------- | ------ |
| Worker bootstrap  | ✅      |
| Middleware        | ✅      |
| Health endpoint   | ✅      |
| Plants API        | ✅      |
| Supabase conexion | ✅      |
| Migraciones DB    | ✅      |
| Persistencia      | ✅      |

Progreso backend:

**≈ 90%**

---

# 4. Frontend (Next.js)

Estado:

❌ No iniciado

Estructura planeada:

```txt
apps/web
 app/(tabs)
   home
   toni
   garden
   plan
   settings
```

Componentes planeados:

- TabBar
- Header
- PlantCard
- ChatView
- Composer

---

# 5. Chat Toni (pendiente)

Endpoints a implementar:

```txt
POST /chat/send
GET /chat/threads
GET /chat/threads/:id
```

Tablas usadas:

```txt
chat_threads
chat_messages
```

Flujo:

```txt
User
 ↓
Worker
 ↓
AI
 ↓
Guardar respuesta
```

---

# 6. Deploy

Pendiente:

```txt
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler deploy
```

Frontend:

```txt
Cloudflare Pages
```

---

# 7. Plan restante de Semana 1

### Dia 3

Construir UI Garden.

---

### Dia 4

Backend Chat Toni.

---

### Dia 5

UI Chat.

---

### Dia 6-7

Pulido.

Deploy.

---

# Bloqueadores actuales

Ninguno.

Infraestructura backend lista.

---

# Proximo paso del proyecto

Implementar:

```txt
Chat Toni v0
```

---

# Progreso global de Semana 1

| Area     | Progreso |
| -------- | -------- |
| Backend  | 90%      |
| Database | 100%     |
| Frontend | 0%       |
| Chat     | 0%       |
| Deploy   | 0%       |

---

# Proxima fase

**Worker Chat API**

Implementar conversacion persistente.
