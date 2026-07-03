# 🔗 Conectar Repositorio Git a Railway

## Tu Proyecto Railway Actual
```
URL: https://railway.com/project/0d64a1b5-c17c-450a-ac01-78ac52ec8bd2
Environment: 46075911-857d-48f3-a4ee-2d44b2508b6e
```

---

## PASO 1: Crear Repositorio en GitHub

### 1.1 Crear nuevo repositorio

```
Ir a: https://github.com/new

Datos:
├─ Repository name: canteen-pay
├─ Description: Sistema digital monedero para comedores
├─ Public (recomendado para Railway)
└─ Create repository
```

### 1.2 Agregar remoto local

```bash
# En PowerShell, en: C:\Users\Alan\canteen-pay

git remote add origin https://github.com/TU_USUARIO/canteen-pay.git
git branch -M main
git push -u origin main
```

**Cambiar `TU_USUARIO` por tu username de GitHub**

Resultado: Tu código está en GitHub ✅

---

## PASO 2: Conectar GitHub a Railway

### 2.1 En Dashboard Railway

```
1. Ir a: https://railway.app/dashboard
2. Seleccionar proyecto: 0d64a1b5-c17c-450a-ac01-78ac52ec8bd2
3. Click en "Settings"
4. "Service" → "+ New"
5. "Deploy from GitHub"
```

### 2.2 Autorizar GitHub

```
1. Click "Authorize"
2. Ingresar credenciales GitHub
3. Autorizar acceso a canteen-pay
4. Seleccionar repositorio: TU_USUARIO/canteen-pay
5. "Deploy"
```

Resultado: Railway obtiene el código ✅

---

## PASO 3: Configurar Variables de Entorno

### 3.1 En Railway Dashboard

```
1. Tu Proyecto → Variables
2. Click "Raw Editor"
3. Agregar estas variables:

NODE_ENV=production
PORT=3001
JWT_SECRET=generar_con_openssl
JWT_EXPIRES_IN=7d
API_URL=https://TU_DOMINIO.railway.app
FRONTEND_URL=https://TU_DOMINIO.railway.app
```

### 3.2 Usar Railway Insights para URLs

```
En Railway:
Deployments → [tu deployment actual]
Dominio público: 
    https://canteen-pay-prod-XXXX.up.railway.app

Copiar esa URL a API_URL y FRONTEND_URL
```

Resultado: Variables configuradas ✅

---

## PASO 4: Agregar Bases de Datos

### 4.1 PostgreSQL

```
En Railway Dashboard:
1. Click "New"
2. Database → PostgreSQL
3. Esperar a que esté "Running"
4. Copiar CONNECTION STRING
5. En Variables: DATABASE_URL = [connection string]
6. Re-deploy
```

### 4.2 Redis

```
En Railway Dashboard:
1. Click "New"
2. Database → Redis
3. Esperar a que esté "Running"
4. Copiar CONNECTION STRING
5. En Variables: REDIS_URL = [connection string]
6. Re-deploy
```

Resultado: Bases de datos conectadas ✅

---

## PASO 5: Verificar Deploy

```bash
# 1. Ir a: https://tu-dominio.railway.app
# 2. Verificar:
   □ Frontend carga
   □ No hay errores 500
   □ Login funciona
   □ Database conecta

# 3. En terminal:
   railway logs
   
# 4. Buscar:
   ✅ Server running on port 3001
   ✅ Connected to database
   ✅ Redis connected
```

---

## ⚡ Método Rápido (sin GitHub)

Si prefieres uploadar directo con Railway CLI:

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login --email alanquezada.ecn@gmail.com

# 3. Link a proyecto
railway link

# 4. Upload
railway up

# 5. Ver logs
railway logs
```

---

## 🎯 Comando Rápido para Push a GitHub

```bash
# Desde C:\Users\Alan\canteen-pay

# 1. Agregar remoto (si no lo hiciste)
git remote add origin https://github.com/TU_USUARIO/canteen-pay.git

# 2. Cambiar a main
git branch -M main

# 3. Push
git push -u origin main

# ¡Listo! Railway auto-detecta y deploya
```

---

## 📞 Soporte Railway

```
Documentos útiles:
├─ Railway Docs: https://docs.railway.app
├─ Deploy guide: https://docs.railway.app/deploy
├─ Troubleshooting: https://docs.railway.app/troubleshooting
└─ CLI Reference: https://docs.railway.app/cli
```

---

## ✅ Checklist Final

```
□ Repositorio GitHub creado
□ Código pusheado a GitHub
□ Railway conectado a GitHub
□ PostgreSQL provisioned
□ Redis provisioned
□ Variables de entorno configuradas
□ Deploy exitoso
□ Frontend accesible
□ Backend responde
□ Base de datos funciona
```

---

**¿Prefieres método con GitHub o CLI de Railway?**
