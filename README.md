# Canteen Pay - Sistema de Pago Digital para Comedores

Un sistema moderno y premium de pago mediante monedero digital para comedores empresariales. Los empleados tienen un QR personal que se escanea para procesar compras.

## 🚀 Características Principales

- **Autenticación JWT** - Registro e inicio de sesión seguros
- **Panel de Usuario Premium** - Dashboard con saldo destacado
- **QR Único** - Código QR personalizado por usuario para escanear compras
- **Historial de Transacciones** - Vista completa de compras y recargas
- **Estado de Cuenta** - Resumen detallado con filtros de fecha
- **Recargas de Saldo** - Preparado para Stripe, MercadoPago y efectivo
- **Diseño Responsivo** - Optimizado para mobile y desktop
- **Interfaz Premium** - Glassmorphism, animaciones suaves, colores corporativos

## 📋 Stack Tecnológico

### Backend
- Node.js + Express.js
- Prisma ORM
- PostgreSQL
- JWT Auth
- QRCode Generator

### Frontend
- React 18 + TypeScript
- Vite
- TailwindCSS v3
- Zustand (State Management)
- React Router v6
- Axios
- Lucide Icons

## 📦 Instalación

### Requisitos Previos
- Node.js 16+
- PostgreSQL 12+
- npm o yarn

### Backend

```bash
cd backend
npm install

# Configurar base de datos
# 1. Crear base de datos "canteen_pay"
# 2. Actualizar DATABASE_URL en .env

npm run prisma:migrate
npm run prisma:generate
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🔧 Configuración

### Variables de Entorno

**Backend (.env)**
```
DATABASE_URL=postgresql://user:password@localhost:5432/canteen_pay
JWT_SECRET=tu_clave_secreta_aqui
JWT_EXPIRE_IN=1h
JWT_REFRESH_EXPIRE_IN=7d
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:3001
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/register` - Crear cuenta
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/refresh` - Renovar token

### Usuario
- `GET /api/users/me` - Obtener perfil
- `PUT /api/users/me` - Actualizar perfil
- `PUT /api/users/me/password` - Cambiar contraseña
- `GET /api/users/me/qr` - Obtener QR

### Transacciones
- `GET /api/transactions` - Listar transacciones (paginado)
- `GET /api/transactions/summary` - Resumen de transacciones

## 🎨 Diseño

### Paleta de Colores
- **Primary**: Navy (#0F172A)
- **Accent**: Emerald (#10B981)
- **Background**: Slate (#F8FAFC)

### Componentes
- Glassmorphism Cards
- Hero Balance Card
- Transaction List
- QR Display
- Navigation (Sidebar + Bottom Nav)

## 📱 Páginas

### Públicas
- Login
- Register (2 pasos)

### Protegidas (Usuario)
- Dashboard - Vista general con saldo y últimas compras
- Mi QR - Pantalla de código QR escaneable
- Compras - Historial de compras
- Recargas - Historial y gestión de recargas
- Estado de Cuenta - Resumen detallado con filtros
- Perfil - Editar datos personales y contraseña

## 🚀 Próximas Fases

- [ ] Fase 2: Panel de Cajero (escaneo de QR, cobro)
- [ ] Fase 3: Panel Administrativo (gestión de usuarios, reportes)
- [ ] Fase 4: Integración Stripe/MercadoPago
- [ ] Fase 5: Aplicación móvil nativa
- [ ] Fase 6: Sistema de notificaciones

## 🔐 Seguridad

- Contraseñas hasheadas con bcrypt
- JWT tokens con expiración
- Refresh tokens para renovación segura
- CORS configurado
- Validación de entrada
- Protección de rutas

## 📦 Deploy

### Railway (Recomendado)

1. Crear proyecto en Railway
2. Conectar PostgreSQL add-on
3. Configurar variables de entorno
4. Deploy backend como Node service
5. Deploy frontend como static site

## 📝 Desarrollo

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Acceder
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

## 📄 Licencia

MIT

---

**Creado por Alan Quezada** - Sistema Premium de Pago para Comedores
