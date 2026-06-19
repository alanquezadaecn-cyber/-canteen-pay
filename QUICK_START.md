# ⚡ Quick Start - Canteen Pay

## 🎯 En 5 Minutos

### 1. Base de Datos

```bash
cd C:\Users\Alan\canteen-pay

# Opción A: Docker (recomendado)
docker-compose up -d

# Opción B: PostgreSQL local
# createdb canteen_pay
```

### 2. Backend

```bash
cd backend

npm install
npm run prisma:migrate
npm run prisma:seed

npm run dev
```

✅ Backend listo en `http://localhost:3001`

### 3. Frontend (nueva terminal)

```bash
cd frontend

npm install
npm run dev
```

✅ App lista en `http://localhost:5173`

---

## 🧪 Login de Prueba

```
Email: juan@example.com
Password: password123
```

Otros usuarios disponibles:
- `maria@example.com` / password123
- `carlos@example.com` / password123 (Cajero)
- `admin@example.com` / password123 (Admin)

---

## 📱 Pantallas Principales

### Panel de Usuario
- ✅ Dashboard con saldo y últimas compras
- ✅ Mi QR - Código QR escaneable
- ✅ Mis Compras - Historial con filtros
- ✅ Recargas - Historial y nueva recarga
- ✅ Estado de Cuenta - Resumen detallado
- ✅ Perfil - Editar datos y cambiar contraseña

---

## 🛠️ Comandos Útiles

### Backend

```bash
npm run dev                # Dev server con hot reload
npm run start             # Servidor producción
npm run prisma:migrate   # Ejecutar migraciones
npm run prisma:seed      # Cargar datos de prueba
npm run prisma:studio    # Ver BD en interfaz visual
```

### Frontend

```bash
npm run dev              # Dev server
npm run build            # Build producción
npm run preview          # Preview del build
npm run lint             # Linter
```

---

## 🔄 Reiniciar Todo

```bash
# Backend
cd backend
npm run prisma:migrate reset
npm run prisma:seed
npm run dev

# Frontend
cd frontend
npm run dev
```

---

## 🎨 Características

- **Autenticación JWT** - Tokens con auto-refresh
- **Glassmorphism Premium** - Diseño moderno y elegante
- **Responsive** - Desktop sidebar + mobile bottom nav
- **QR Único** - Código generado por usuario
- **Transacciones** - Historial completo con balance antes/después
- **Estado de Cuenta** - Resumen con filtros de fecha

---

## 📝 Próximas Fases

- Fase 2: Panel de Cajero (escaneo QR)
- Fase 3: Panel Administrativo
- Fase 4: Pagos reales (Stripe/MercadoPago)
- Fase 5: App móvil

---

## ❓ Problemas?

**Puerto en uso:**
- Cambiar `PORT=3001` en backend/.env
- Cambiar puerto en frontend/vite.config.js

**BD no conecta:**
- Verificar: `docker-compose up -d`
- O: `psql -U postgres -d canteen_pay`

**Módulos faltantes:**
```bash
npm install
npm run prisma:generate
```

---

🎉 **¡Listo! Abre http://localhost:5173 y comienza.**
