# Alicia's Garden - Semana 1

Estado de ejecucion actualizado (Plan + Progreso real)

---

# Vision de Semana 1

## Objetivo de la semana

Construir las **fundaciones completas del producto** para que exista una aplicacion funcional donde una unica usuaria (la suegra del creador) pueda:

- Abrir la aplicacion
- Navegar entre secciones principales
- Hablar con **Toni (IA de jardineria)**
- Guardar el historial del chat
- Crear plantas
- Ver su jardin
- Tener un dashboard simple

Todo esto **sin sistema de login**.

---

# Estado general del proyecto

| Area                       | Estado         |
| -------------------------- | -------------- |
| Arquitectura               | ✅ Definida     |
| Backend Worker             | ✅ Implementado |
| Persistencia DB            | ✅ Funcionando  |
| API Plants                 | ✅ Completa     |
| Supabase CLI + Migraciones | ✅ Configurado  |
| Chat Toni API              | ✅ Implementado |
| Frontend Next.js           | ❌ No iniciado  |
| Deploy                     | ❌ No iniciado  |

**Progreso estimado:**
Backend: **~100% completo**

---

# Decisiones de arquitectura (cerradas)

Estas decisiones eliminan complejidad innecesaria para esta app.

## Usuario unico

```txt
profile_id = "default_profile"
```

No existe autenticacion.

---

## Backend como BFF

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

## Supabase

Usado para:

- Base de datos
- Storage (futuro)

---

## IA

La IA vive **exclusivamente en el Worker**.

```txt
Frontend
   ↓
Worker
   ↓
OpenAI
```

Las claves **nunca llegan al cliente**.

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
- maneje la base de datos
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

**Estado:**
✅ COMPLETADO

---

# Subfase B - Plumbing base

## Objetivo

Crear utilidades base que usara toda la API.

---

## src/types/env.ts

Bindings definidos:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
PROFILE_ID
CORS_ORIGIN
AI_API_KEY
```

---

## src/lib/supabase.ts

Cliente Supabase centralizado.

```txt
getSupabase(env)
```

Configuracion:

- service role
- sin persistSession

---

## src/lib/http.ts

Helpers HTTP implementados:

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
```

Errores:

```txt
{
 ok:false,
 error:{ code,message }
}
```

**Estado:**
✅ COMPLETADO

---

# Subfase C - Middleware global

## Objetivo

Infraestructura transversal para la API.

---

## errors.ts

Middleware global que:

- captura excepciones
- devuelve JSON consistente

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

Placeholder en memoria:

```txt
60 requests/min
Map por IP
```

Error:

```txt
429 RATE_LIMITED
```

**Estado:**
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

**Estado:**
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

**Estado:**
✅ COMPLETADO

---

# Subfase F - Chat API (Toni v0)

Implementacion completa de conversacion persistente.

## Endpoints implementados

```txt
POST /chat/send
GET /chat/threads
GET /chat/threads/:id
```

---

## Flujo completo

```txt
User
 ↓
/chat/send
 ↓
Worker
 ↓
Supabase guarda mensaje user
 ↓
OpenAI
 ↓
Supabase guarda respuesta assistant
 ↓
API Response
```

---

## Persistencia

Tablas utilizadas:

```txt
chat_threads
chat_messages
```

Cada mensaje queda almacenado.

---

## Servicio IA

Archivo:

```txt
services/ai.ts
```

Modelo utilizado:

```txt
gpt-4o-mini
```

Fallback implementado si IA falla.

---

## Servicio Chat

Archivo:

```txt
services/chat.ts
```

Responsable de:

- crear threads
- guardar mensajes
- recuperar historial
- llamar IA

---

## Router

Archivo:

```txt
routes/chat.ts
```

Montado en:

```txt
index.ts
```

---

## Verificacion E2E

Pruebas realizadas:

```txt
POST /chat/send
GET /chat/threads
GET /chat/threads/:id
```

Resultados:

- thread creado
- mensajes guardados
- historial recuperado

Persistencia confirmada en Supabase.

**Estado:**
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

## Migraciones

Archivo:

```txt
supabase/migrations/20260305035241_init_schema.sql
```

Contiene tablas:

```txt
plants
chat_threads
chat_messages
```

---

## Migracion aplicada

```txt
supabase db push
```

Resultado:

Migracion aplicada correctamente.

---

## Verificacion

Tablas existentes:

```txt
plants
chat_threads
chat_messages
```

---

## Verificacion del Worker

```txt
GET /plants
-> 200 OK
```

```txt
POST /plants
-> 201 Created
```

Persistencia confirmada.

**Estado:**
✅ COMPLETADO

---

# Backend actual

| Componente        | Estado |
| ----------------- | ------ |
| Worker bootstrap  | ✅      |
| Middleware        | ✅      |
| Health endpoint   | ✅      |
| Plants API        | ✅      |
| Chat API          | ✅      |
| Supabase conexion | ✅      |
| Migraciones DB    | ✅      |
| Persistencia      | ✅      |

Progreso backend:

```txt
≈ 100%
```

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

---

## Componentes planeados

```txt
TabBar
Header
PlantCard
ChatView
Composer
MessageBubble
```

---

# 5. Integracion Web -> Worker

Archivo futuro:

```txt
apps/web/lib/api.ts
```

Funciones:

```txt
getPlants()
createPlant()
sendChatMessage()
getThreads()
getThread()
```

---

# 6. Deploy

Pendiente:

```txt
wrangler deploy
```

Secrets:

```txt
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put AI_API_KEY
```

Frontend deploy:

```txt
Cloudflare Pages
```

---

# 7. Plan restante de Semana 1

## Dia 3

Construir UI Garden.

## Dia 4

UI Chat Toni.

## Dia 5

Integracion frontend -> Worker.

## Dia 6-7

Pulido UI.
Deploy.

---

# Bloqueadores actuales

Ninguno.

Infraestructura backend completamente funcional.

---

# Progreso global de Semana 1

| Area     | Progreso |
| -------- | -------- |
| Backend  | 100%     |
| Database | 100%     |
| Frontend | 0%       |
| Chat UI  | 0%       |
| Deploy   | 0%       |

---

# Proxima fase

## Frontend Next.js

Construir la interfaz de usuario que consuma la API del Worker.

Pantallas prioritarias:

```txt
/home
/toni
/garden
```

Objetivo:

Permitir que la usuaria:

- vea su jardin
- cree plantas
- converse con Toni

---

**Fin del estado actualizado de Semana 1.**
