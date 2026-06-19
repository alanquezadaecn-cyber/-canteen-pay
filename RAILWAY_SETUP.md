# 🚀 Canteen Pay en Railway

## Paso 1: Crear Repositorio en GitHub

```bash
# 1. Ir a https://github.com/new
# 2. Nombre: canteen-pay
# 3. Descripción: Sistema digital de monedero para comedores
# 4. Público o Privado
# 5. Crear repositorio

# 6. Agregar remoto
git remote add origin https://github.com/TU_USUARIO/canteen-pay.git
git branch -M main
git push -u origin main
```

---

## Paso 2: Conectar a Railway

### Opción A: Dashboard Web (Recomendado)

```
1. Ir a https://railway.app
2. Sign in / Create account
3. "Start a New Project"
4. "Deploy from GitHub"
5. Seleccionar repositorio: canteen-pay
6. "Deploy Now"
```

### Opción B: CLI

```bash
# 1. Instalar CLI
npm install -g @railway/cli

# 2. Login
railway login --email alanquezada.ecn@gmail.com

# 3. Conectar repositorio
railway link

# 4. Seleccionar repositorio

# 5. Deploy
railway up
```

---

## Paso 3: Configurar Servicios

### Base de Datos (PostgreSQL)

```bash
# En Dashboard Railway:
1. "+ New" → "Database" → "PostgreSQL"
2. Esperar a que se provisione
3. Copy connection string
4. Variables → DATABASE_URL = [connection string]
```

### Redis (Caché)

```bash
# En Dashboard Railway:
1. "+ New" → "Database" → "Redis"
2. Esperar a que se provisione
3. Copy connection string
4. Variables → REDIS_URL = [connection string]
```

### Backend + Frontend

```bash
# Railway auto-detecta Dockerfile y deploya
# El servicio web está listo
```

---

## Paso 4: Variables de Entorno

```bash
# En Dashboard Railway → Variables:

# Database
DATABASE_URL=postgresql://...@...rail.app:5432/...

# Redis
REDIS_URL=redis://...@...railway.app:19...

# Seguridad
JWT_SECRET=openssl rand -base64 32
NODE_ENV=production
PORT=3001

# URLs
API_URL=https://tu-app.railway.app
FRONTEND_URL=https://tu-app.railway.app

# Stripe (Opcional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# MercadoPago (Opcional)
MP_ACCESS_TOKEN=APP_USR_...
MP_PUBLIC_KEY=APP_USR_...
```

---

## Paso 5: Domains (URL Pública)

```bash
# En Dashboard Railway → Deployments → Settings:

1. "Public URL" → Copiar dominio auto-generado
   Ej: canteen-pay-production.up.railway.app

2. (Opcional) Agregar dominio personalizado
   Ej: canteen-pay.com
   - Cambiar nameservers en registrador de dominio
   - Esperar 24-48h para propagación
```

---

## Paso 6: Verificar Deploy

```bash
# Abrir en navegador
https://tu-app.railway.app

# Checklist:
✅ Frontend carga sin errores
✅ Login funciona (con credenciales de prueba)
✅ Dashboard muestra datos
✅ WebSocket conecta (inspector DevTools)
✅ Base de datos responde
✅ Redis caché funciona
```

---

## Monitoreo Continuous

### Logs

```bash
# En terminal
railway logs

# En Dashboard
Deployments → Logs
```

### Métricas

```
Railway Dashboard:
├─ CPU Usage
├─ Memory Usage
├─ Network I/O
├─ Uptime
└─ Logs en tiempo real
```

### Health Check

```
Railway realiza checks cada 30s:
GET http://localhost:3001/health

Status:
├─ ✅ Healthy → App funciona
├─ ⚠️ Degraded → Revisar logs
└─ ❌ Unhealthy → Crash, restart automático
```

---

## Auto-Deploy desde GitHub

```bash
# Railway se conecta a tu repositorio

# Trigger auto-deploy:
1. Push a rama 'main'
2. Railway detecta cambios
3. Rebuild automático
4. Deploy en ~2-5 minutos

# Ver progreso:
Railway Dashboard → Deployments → Building...
```

---

## Escalar en Railway

### Aumentar Recursos

```bash
# CPU
railway variables set RAILWAY_CPU=2

# Memoria
railway variables set RAILWAY_MEMORY=2GB

# Replicas
railway scale --region=us-west1 web=2
```

### Load Balancing

```
Railway provee load balancer automático si:
├─ Tienes múltiples replicas
├─ Tráfico > 1000 req/s
└─ Alta disponibilidad requerida
```

---

## Troubleshooting

### Error: "Build failed"

```bash
# Ver logs
railway logs --tail 100

# Soluciones comunes:
1. npm install pendiente
   → Limpiar: rm -rf node_modules
   
2. Puerto en uso
   → Cambiar PORT=3001 en variables
   
3. Falta DATABASE_URL
   → Agregar variable en Railway
```

### Error: "Connection refused"

```bash
# Base de datos no accesible
1. Verificar DATABASE_URL está correcto
2. Esperar a que PostgreSQL esté listo (2-3 min)
3. Realizar seed: yarn seed
```

### Error: "Memory exceeded"

```bash
# App se crashea por memoria
1. Aumentar memoria a 2GB
2. Revisar queries N+1 en código
3. Implementar connection pooling
```

---

## Backup & Restore

### Backup Automático

```
Railway realiza backups automáticos cada:
├─ Diario (7 días de retención)
├─ Semanal (4 semanas)
└─ Mensual (indefinido)
```

### Backup Manual

```bash
# Exportar base de datos
pg_dump $DATABASE_URL > backup.sql

# Restaurar
psql $DATABASE_URL < backup.sql
```

---

## Costo Estimado

```
Canteen Pay en Railway (5000 usuarios):

├─ Web (1 app, 512MB): $7/mes
├─ PostgreSQL (10GB): $12/mes
├─ Redis (500MB): $7/mes
├─ Bandwidth (100GB): $10/mes
└─ ─────────────────────────
   TOTAL: ~$36/mes

Escalable a:
├─ 100K usuarios → $120-200/mes
├─ 1M usuarios → $500-1000/mes
└─ 10M usuarios → $2000-5000/mes
```

---

## Checklist Final

- [ ] GitHub repo creado
- [ ] Railway account creado
- [ ] Repositorio conectado a Railway
- [ ] PostgreSQL provisioned
- [ ] Redis provisioned
- [ ] Variables de entorno configuradas
- [ ] Deploy exitoso
- [ ] Frontend accesible
- [ ] Backend responde
- [ ] Database conecta
- [ ] Logs revisados sin errores
- [ ] Domain personalizado (opcional)

---

**¡Sistema en producción en Railway!** 🎉

URL: `https://tu-app.railway.app`
Admin: `alanquezada.ecn@gmail.com`
