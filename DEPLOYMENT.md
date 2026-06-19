# 🚀 Deployment Guide - Canteen Pay

## Railway Deployment

### Requisitos
- Cuenta en Railway (railway.app)
- GitHub/GitLab conectado (opcional, pero recomendado)
- Variables de entorno configuradas

### Variables de Entorno Requeridas

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname

# Redis
REDIS_URL=redis://user:password@host:port

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Stripe (Opcional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# MercadoPago (Opcional)
MP_ACCESS_TOKEN=APP_USR_...
MP_PUBLIC_KEY=APP_USR_...

# API URL
API_URL=https://tu-app.railway.app
FRONTEND_URL=https://tu-app.railway.app

# Node
NODE_ENV=production
PORT=3001
```

### Pasos de Deployment

#### 1. Conectar Repositorio a Railway

```bash
# Instalar CLI de Railway
npm install -g @railway/cli

# Login
railway login

# Crear nuevo proyecto
railway init

# Seguir instrucciones en pantalla
```

#### 2. Configurar Variables de Entorno

```bash
# En el dashboard de Railway:
# 1. Variables → Add Variable
# 2. Pegar cada variable de .env
```

#### 3. Crear Servicios

```bash
# PostgreSQL
# - Database → Add → PostgreSQL → Provision

# Redis
# - Database → Add → Redis → Provision

# Web Service (Backend + Frontend)
# - Deploy → Dockerfile → Conectar repositorio
```

#### 4. Deploy

```bash
# Primera vez
railway up

# Siguientes veces (si usas GitHub)
# Railway auto-deploya al hacer push a main
```

### Monitoring

```bash
# Ver logs en tiempo real
railway logs

# Ver status
railway status

# Ver variables
railway variables
```

### Escala

```bash
# Aumentar réplicas
railway scale web=2

# Aumentar memoria
railway resources --set memory=2GB
```

---

## Variables de Entorno Críticas

### Base de Datos
- `DATABASE_URL`: Conexión PostgreSQL completa
- `REDIS_URL`: Conexión Redis para caché y sesiones

### Seguridad
- `JWT_SECRET`: Usar `openssl rand -base64 32`
- `STRIPE_WEBHOOK_SECRET`: De panel de Stripe
- `MP_ACCESS_TOKEN`: De panel de MercadoPago

### URLs
- `API_URL`: URL pública del backend (para webhooks)
- `FRONTEND_URL`: URL del frontend (para CORS)

---

## Monitoreo Post-Deploy

✅ **Checklist:**
- [ ] Frontend carga sin errores
- [ ] Login funciona
- [ ] Dashboard muestra datos
- [ ] WebSocket conecta (QR Scanner)
- [ ] Webhooks reciben pagos
- [ ] Base de datos responde
- [ ] Redis caché funciona

---

## Troubleshooting

### Error: `Cannot find module`
```bash
# Solución: Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
railway up
```

### Error: `Connection refused` en BD
```bash
# Verificar DATABASE_URL en Railway
railway variables

# Usar connection pooling si es necesario
# PgBouncer o connection pool en código
```

### Error: `Memory exceeded`
```bash
# Aumentar memoria
railway scale --set memory=2GB
```

---

**¡Sistema listo para producción!** 🎉
