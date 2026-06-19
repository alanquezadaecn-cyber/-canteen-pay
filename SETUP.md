# 🚀 Guía de Instalación - Canteen Pay

## 📋 Requisitos Previos

- **Node.js** 16+ ([descargar](https://nodejs.org/))
- **PostgreSQL** 12+ ([descargar](https://www.postgresql.org/download/)) O **Docker** ([descargar](https://www.docker.com/))
- **npm** (incluido con Node.js)

## 1️⃣ Configurar Base de Datos

### Opción A: Con Docker (Recomendado)

```bash
cd canteen-pay
docker-compose up -d

# Esperar 10 segundos para que PostgreSQL inicie
```

### Opción B: PostgreSQL Local

```bash
# Crear base de datos
createdb canteen_pay

# O con psql:
# psql -U postgres
# CREATE DATABASE canteen_pay;
```

## 2️⃣ Backend Setup

```bash
cd backend

# Instalar dependencias
npm install

# Configurar Prisma
npm run prisma:generate
npm run prisma:migrate

# (Opcional) Cargar datos de prueba
npm run prisma:seed

# Iniciar servidor de desarrollo
npm run dev
```

**El servidor estará disponible en:** `http://localhost:3001`

### Verificar conexión:

```bash
curl http://localhost:3001/health
# Debe responder: {"status":"ok"}
```

## 3️⃣ Frontend Setup

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

**La app estará disponible en:** `http://localhost:5173`

## 🧪 Usuarios de Prueba

Después de ejecutar `npm run prisma:seed`, puedes usar:

| Email | Password | Rol |
|-------|----------|-----|
| juan@example.com | password123 | Usuario |
| maria@example.com | password123 | Usuario |
| carlos@example.com | password123 | Cajero |
| admin@example.com | password123 | Admin |

## 🛠️ Desarrollo

Mantén dos terminales abiertas:

**Terminal 1: Backend**
```bash
cd backend
npm run dev
```

**Terminal 2: Frontend**
```bash
cd frontend
npm run dev
```

## 📦 Comandos Útiles

### Backend

```bash
# Reiniciar migrations
npm run prisma:migrate reset

# Ver DB en interfaz gráfica
npm run prisma:studio

# Compilar para producción
npm run build
```

### Frontend

```bash
# Construir para producción
npm run build

# Preview de producción
npm run preview

# Linter
npm run lint
```

## 🔧 Configuración de Variables de Entorno

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/canteen_pay"

# Auth
JWT_SECRET="tu_clave_super_segura_cambiar_en_produccion"
JWT_EXPIRE_IN="1h"
JWT_REFRESH_EXPIRE_IN="7d"

# Server
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"

# Pagos (agregar luego)
STRIPE_SECRET_KEY="sk_test_..."
MERCADOPAGO_ACCESS_TOKEN="APP_USR_..."
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 🐛 Troubleshooting

### Error: `connect ECONNREFUSED 127.0.0.1:5432`
- PostgreSQL no está corriendo
- Con Docker: `docker-compose up -d`
- Localmente: verifica que PostgreSQL esté iniciado

### Error: `Cannot find module '@prisma/client'`
```bash
cd backend
npm install
npm run prisma:generate
```

### Puerto 3001 o 5173 ya está en uso
```bash
# Cambiar puerto en vite.config.js o en .env del backend
```

### Base de datos vacía
```bash
cd backend
npm run prisma:migrate
npm run prisma:seed
```

## 📚 Próximas Fases

- Fase 2: Panel de Cajero (escaneo QR)
- Fase 3: Panel Administrativo
- Fase 4: Integración de pagos reales
- Fase 5: App móvil

---

**¡Listo! 🎉 Ya puedes comenzar a desarrollar. Abre http://localhost:5173 en tu navegador.**
