# 📦 DEPLOY A RAILWAY - Pasos Rápidos

## ✅ Completado Localmente

```
✅ Repositorio Git inicializado
✅ Dockerfile creado
✅ Railway.json configurado
✅ Variables de entorno documentadas
✅ 2 commits en main
✅ Proyecto listo para producción
```

---

## 🚀 3 Pasos para Producción

### PASO 1: Crear Repositorio en GitHub

```bash
# 1. Ve a https://github.com/new
# 2. Datos:
#    - Name: canteen-pay
#    - Description: Sistema digital monedero para comedores
#    - Public (o Private si prefieres)
#    - Agregar .gitignore: None (ya lo tenemos)
# 3. Click "Create repository"

# 4. En tu terminal, en C:\Users\Alan\canteen-pay:
git remote add origin https://github.com/TU_USUARIO/canteen-pay.git
git branch -M main
git push -u origin main

# Cambiar TU_USUARIO por tu username de GitHub
```

**Resultado:** Tu proyecto está en GitHub

---

### PASO 2: Crear Cuenta Railway

```
1. Ir a https://railway.app/dashboard
2. Sign up / Login
3. Crear nuevo proyecto
4. Conectar GitHub
5. Seleccionar repositorio: canteen-pay
6. Autorizar acceso
```

**Resultado:** Railway obtiene acceso al repositorio

---

### PASO 3: Deploy Automático

```bash
# En Dashboard de Railway:

1. "Create New Project"
2. "Deploy from GitHub"
3. Buscar: canteen-pay
4. Conectar
5. Click "Deploy"

# Esperar ~5 minutos mientras:
# ├─ Clone repositorio
# ├─ Build Docker image
# ├─ Deploy a servidor
# └─ Asignar dominio público
```

**Resultado:** App accesible en `https://canteen-pay-production.up.railway.app`

---

## 🔧 Configurar Servicios

Una vez deployado, agregar bases de datos:

### Base de Datos PostgreSQL

```
1. En Railway Dashboard
2. Click "New"
3. Database → PostgreSQL
4. Esperar a que esté "Running"
5. Copiar: DATABASE_URL
6. Ir a Variables → Agregar DATABASE_URL
7. Re-deploy
```

### Redis Cache

```
1. En Railway Dashboard
2. Click "New"
3. Database → Redis
4. Esperar a que esté "Running"
5. Copiar: REDIS_URL
6. Ir a Variables → Agregar REDIS_URL
7. Re-deploy
```

---

## 🌐 Variables de Entorno Críticas

```bash
# Agregar en Railway → Variables:

NODE_ENV=production
PORT=3001

# Database (copiado de PostgreSQL)
DATABASE_URL=postgresql://...

# Redis (copiado de Redis)
REDIS_URL=redis://...

# JWT
JWT_SECRET=GENERAR_CON: openssl rand -base64 32
JWT_EXPIRES_IN=7d

# URLs
API_URL=https://canteen-pay-production.up.railway.app
FRONTEND_URL=https://canteen-pay-production.up.railway.app

# Stripe (opcional, agregar después)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# MercadoPago (opcional, agregar después)
MP_ACCESS_TOKEN=APP_USR_...
```

---

## ✅ Verificar Deploy

```bash
# 1. Abrir en navegador
https://canteen-pay-production.up.railway.app

# 2. Checklist Visual:
□ Página de login carga
□ No hay errores en consola (DevTools F12)
□ Puedo hacer login
□ Dashboard muestra datos
□ WebSocket conecta (Network tab)
□ Botones funcionan sin lag

# 3. Verificar en Railway:
□ Deployment status: Success
□ No hay errores en Logs
□ Health check: ✅ Healthy
```

---

## 📊 Monitorear en Tiempo Real

```bash
# En terminal:
railway logs --tail 50

# O en Dashboard Railway:
Deployments → Logs

# Ver métricas:
Resources → CPU, Memory, Network
```

---

## 🔄 Auto-Deploy Habilitado

A partir de ahora, cuando hagas push a GitHub:

```bash
# Desde tu máquina:
git add .
git commit -m "mi cambio"
git push origin main

# Railway:
1. Detecta cambio en GitHub
2. Inicia build automático (2-3 min)
3. Deploy a producción
4. Tu app actualizada
```

**Sin necesidad de hacer nada más.**

---

## 🛑 Troubleshooting Rápido

### "Build Failed"
```bash
railway logs
# Buscar el error
# Revisar Dockerfile o package.json
```

### "Connection Refused"
```bash
# PostgreSQL aún iniciando
# Esperar 2-3 minutos
# Luego hacer re-deploy
```

### "Memory Exceeded"
```bash
# Aumentar RAM en Railway
# Deployments → Settings → Increase memory to 2GB
```

---

## 📞 Soporte

```
Documentación: C:\Users\Alan\canteen-pay\RAILWAY_SETUP.md
Guía técnica:  C:\Users\Alan\canteen-pay\DEPLOYMENT.md
Arquitectura:  C:\Users\Alan\canteen-pay\RESUMEN_FINAL_SISTEMA.md
```

---

## 🎯 Resumen Final

```
┌─ ANTES ─────────────────────┐
│ Proyecto local              │
│ Sin deployar                │
│ Solo accesible en localhost │
└─────────────────────────────┘
                │
                ▼
      ┌─ DESPUÉS ──────────────┐
      │ En Railway             │
      │ URL pública            │
      │ 24/7 disponible        │
      │ Auto-deploy            │
      │ Escalable              │
      └────────────────────────┘
```

---

## ⏱️ Tiempo Total

```
Crear GitHub repo:        5 min
Setup Railway:           10 min
Deploy aplicación:        5 min
Configurar BD:           10 min
Verificar:               10 min
────────────────────────────
TOTAL:                   40 minutos
```

---

## 🎉 ¡Listo!

Tu Canteen Pay está en:

```
🌐 URL Pública: https://canteen-pay-production.up.railway.app
👤 Email Admin:  alanquezada.ecn@gmail.com
📊 Dashboard:    https://railway.app/dashboard
```

**Siguiente:** Invitar usuarios, importar datos, comenzar operaciones.
