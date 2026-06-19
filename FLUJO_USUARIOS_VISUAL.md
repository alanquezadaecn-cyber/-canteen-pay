# 🌐 Flujo de Conexión de Usuarios - Canteen Pay Multicusursal

## 1️⃣ FASE: ONBOARDING (Administrador)

```
┌─────────────────────────────────────────────────────────────┐
│ ADMIN en Panel                                              │
│                                                             │
│  1. Va a: /admin/users/import                              │
│  2. Descarga plantilla CSV                                 │
│  3. Rellena con 5000 usuarios                              │
│  4. Carga archivo                                          │
│                                                             │
│  CSV Ejemplo:                                               │
│  ─────────────────────────────────────────────────────     │
│  email,name,phone,company,employeeNumber,branchId          │
│  juan@acme.com,Juan Pérez,5551234567,Acme,12345,branch-1  │
│  maria@acme.com,María García,5559876543,Acme,12346,branch-1│
│  ...5000 filas más...                                      │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌─────────────────────────────┐
        │ Backend procesa CSV         │
        │ ✓ Valida datos              │
        │ ✓ Genera UUID para cada uno │
        │ ✓ Crea QR único             │
        │ ✓ Hash de contraseña        │
        │ ✓ Inserta en lotes          │
        │ ✓ Envía emails              │
        └────────┬────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │ Base de Datos               │
        │ INSERT INTO users (5000)    │
        │ - id, email, name, etc.     │
        │ - qrCode: UNIQUE            │
        │ - balance: 0.00             │
        │ - isActive: true            │
        │ - branchId: centro          │
        └────────┬────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────┐
        │ USUARIO recibe EMAIL        │
        │                             │
        │ ┌─────────────────────────┐ │
        │ │ Bienvenida a Canteen    │ │
        │ │                         │ │
        │ │ Tu usuario: juan@acme   │ │
        │ │ Contraseña: Temp@123   │ │
        │ │                         │ │
        │ │ [Descargar QR]          │ │
        │ │ [Ir a Portal]           │ │
        │ │                         │ │
        │ │ Tu QR único:            │ │
        │ │ [QR_IMAGE_5000px]       │ │
        │ │                         │ │
        │ └─────────────────────────┘ │
        │                             │
        └─────────────────────────────┘
```

---

## 2️⃣ FASE: PRIMER LOGIN (Usuario)

```
USER DEVICE (Teléfono/Tablet)
│
│  1. Recibió email con link
│  2. Hace clic en "Ir a Portal"
│  ▼
┌───────────────────────────────────────┐
│ LOGIN: http://localhost:5175/login    │
│                                       │
│ Email:     juan@acme.com     ✓        │
│ Password:  Temp@123          ✓        │
│                                       │
│ [Ingresar]                            │
│                                       │
│ ¿Olvidó contraseña? [Recuperar]       │
│                                       │
└───────────┬───────────────────────────┘
            │
            ▼ (Validación en Backend)
    ┌──────────────────────┐
    │ Verificar:           │
    │ - Email existe       │
    │ - Password correcto  │
    │ - Usuario activo     │
    │ - Generar JWT Token  │
    │ - Guardar en BD      │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ Primeros cambios:    │
    │ - Pedir nueva pwd    │
    │ - Aceptar términos   │
    │ - Tutorial (opcional)│
    └────────┬─────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ DASHBOARD USUARIO                   │
│                                     │
│ ¡Hola, Juan Pérez! 👋              │
│ Martes, 18 de Junio de 2026         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ MI SALDO: $0.00                 │ │
│ │ [Recargar Saldo] [Mi QR]        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Acciones rápidas:                   │
│ [Mi QR 🎫]  [Recargar 💵]          │
│ [Compras 🛍️] [Historial ⏱️]        │
│                                     │
│ Últimas transacciones:              │
│ (Aún no hay)                        │
│                                     │
└──────────────────────────────────────┘
    │
    ├─→ [Mi QR] → Mostrar QR generado
    ├─→ [Recargar] → Cargar saldo
    ├─→ [Compras] → Historial de cobros
    └─→ [Perfil] → Editar datos
```

---

## 3️⃣ FASE: USO DIARIO (Cajero + Usuario)

```
┌──────────────────────────────────────────────────────────────┐
│                    MOMENTO DEL COBRO                         │
│                   En el Comedor                              │
└──────────────────────────────────────────────────────────────┘

USUARIO                           CAJERO
(Mobile)                      (Desktop/Tablet)
   │                                │
   │ Llega al comedor               │
   │ Toma comida (~$25)             │
   │                                │
   │                        Accede al Panel
   │                        /cashier/scan
   │                                │
   │                         ┌──────▼──────┐
   │                         │ Escanear QR │
   │                         └──────┬──────┘
   │                                │
   │◄────LE PIDE QR────────────────◄│
   │                                │
   │ Muestra QR en teléfono         │
   │ (Descargado o en app)          │
   │                                │
   │                        Apunta cámara
   │                             │
   │                        Escanea QR
   │                             │
   │                        ┌────▼─────────────────┐
   │                        │ Sistema busca:      │
   │                        │ users.qrCode = 'XXX'│
   │                        │ (índice DB: RÁPIDO) │
   │                        └────┬─────────────────┘
   │                             │
   │                        ┌────▼──────────────────────┐
   │                        │ MUESTRA USUARIO:          │
   │                        │ ┌──────────────────────┐ │
   │                        │ │ Juan Pérez           │ │
   │                        │ │ Empleado #12345      │ │
   │                        │ │ Saldo: $125.00       │ │
   │                        │ │ Empresa: Acme Corp   │ │
   │                        │ └──────────────────────┘ │
   │                        └────┬──────────────────────┘
   │                             │
   │                        Ingresa monto
   │                             │
   │                        ┌────▼──────────────────────┐
   │                        │ MONTO A COBRAR: $25.00    │
   │                        │                          │
   │                        │ Nuevo saldo: $100.00      │
   │                        │                          │
   │                        │ [CONFIRMAR PAGO]          │
   │                        └────┬──────────────────────┘
   │                             │
   │                        Procesa transacción
   │                             │
   │                        ┌────▼──────────────────────────┐
   │                        │ Backend:                      │
   │                        │ 1. UPDATE users              │
   │                        │    balance = 100.00          │
   │                        │ 2. INSERT transactions       │
   │                        │ 3. Invalida caché (Redis)    │
   │                        │ 4. Emite WebSocket          │
   │                        └────┬──────────────────────────┘
   │                             │
   │◄────WebSocket Update────────◄│
   │ Tu nuevo saldo: $100.00      │ (Dashboard vivo)
   │ Transacción completada ✓     │
   │                              │
   │ [Mi Saldo] → $100.00         │
   │ [Ver Historial]              │
   │                              │ Imprime comprobante
   │                              │ Juan Pérez - $25
   │                              │ Nuevo saldo: $100
   │                              │
   └──────────────────────────────┘
```

---

## 4️⃣ FASE: RECARGA DE SALDO (Usuario)

```
USER (Mobile)                          PAGO
   │                                    │
   │ [Recargar Saldo]                   │
   │        ▼                            │
   │ ┌────────────────────────┐         │
   │ │ Paso 1: Monto          │         │
   │ │ ┌────────────────────┐ │         │
   │ │ │ $50  $100  $200   │ │         │
   │ │ │ $500 [CUSTOM]     │ │         │
   │ │ └────────────────────┘ │         │
   │ │                        │         │
   │ │ Selecciona: $200       │         │
   │ │ [Siguiente]            │         │
   │ └──────┬─────────────────┘         │
   │        │                            │
   │        ▼                            │
   │ ┌──────────────────────────────┐   │
   │ │ Paso 2: Método de Pago       │   │
   │ │ ┌──────────────────────────┐ │   │
   │ │ │ 💳 Tarjeta (Stripe)     │ │   │
   │ │ │ 💰 MercadoPago          │ │   │
   │ │ │ 🏪 Efectivo en Caja     │ │   │
   │ │ └──────────────────────────┘ │   │
   │ │                              │   │
   │ │ Selecciona: Tarjeta          │   │
   │ │ [Continuar al Pago]          │   │
   │ └──────┬───────────────────────┘   │
   │        │                            │
   │        ▼                            │
   │ ┌──────────────────────────────┐   │
   │ │ Paso 3: Ingresa Tarjeta      │   │
   │ │                              │   │
   │ │ [Stripe Elements]            │   │
   │ │ Número: 4242 4242 4242 4242 │   │
   │ │ Vence: 12/26                │   │
   │ │ CVC: 123                    │   │
   │ │                              │   │
   │ │ [Pagar $200]                 │   │
   │ └──────┬───────────────────────┘   │
   │        │                            │
   │        ├─→ stripe.confirmCardPayment()
   │        │                ▼
   │        │        ┌───────────────────┐
   │        │        │ STRIPE (External) │
   │        │        │ Valida tarjeta    │
   │        │        └────────┬──────────┘
   │        │                 │
   │        │◄─ payment_intent.succeeded
   │        │
   │        ▼
   │ ┌───────────────────────┐
   │ │ Backend Webhook:      │
   │ │ Stripe notifica:      │
   │ │ - Pago confirmado     │
   │ │ - UPDATE users        │
   │ │   balance = 200 + 0   │
   │ │ - INSERT recharges    │
   │ └───┬───────────────────┘
   │     │
   │◄────┘ WebSocket
   │ ✓ Recarga completada
   │ Nuevo saldo: $200.00
   │
   │ [Ir al Dashboard]
   │
```

---

## 5️⃣ FASE: ADMINISTRACIÓN (Admin)

```
ADMIN Panel
│
├─→ /admin
│   ├─→ Dashboard Multicusursal
│   │   ├─ Stats Globales (todas sucursales)
│   │   ├─ Filtro por sucursal
│   │   ├─ Tabla de desempeño sucursales
│   │   └─ Últimas transacciones
│   │
│   ├─→ /admin/branches
│   │   ├─ Crear sucursal
│   │   ├─ Editar sucursal
│   │   ├─ Ver usuarios por sucursal
│   │   ├─ Ver estadísticas detalladas
│   │   └─ Eliminar sucursal
│   │
│   ├─→ /admin/users
│   │   ├─ Listar todos los usuarios (5000+)
│   │   ├─ Búsqueda rápida (FULLTEXT)
│   │   ├─ Filtrar por sucursal
│   │   ├─ Filtrar por estado (activo/inactivo)
│   │   ├─ Ordenar por nombre/saldo/fecha
│   │   ├─ Ver detalles de usuario
│   │   ├─ Activar/Desactivar usuario
│   │   ├─ Exportar a CSV
│   │   └─ Tabla con paginación
│   │
│   ├─→ /admin/users/import
│   │   ├─ Descargar plantilla
│   │   ├─ Cargar CSV (hasta 5000)
│   │   ├─ Ver progreso importación
│   │   ├─ Reporte de éxitos/errores
│   │   └─ Auto-genera QR y envia emails
│   │
│   ├─→ /admin/reports
│   │   ├─ Transacciones por fecha
│   │   ├─ Transacciones por sucursal
│   │   ├─ Transacciones por usuario
│   │   ├─ Análisis de cobros vs recargas
│   │   ├─ Exportar reportes
│   │   └─ Gráficos de tendencias
│   │
│   └─→ /admin/settings
│       ├─ Configuración global
│       ├─ Gestión de roles
│       ├─ Backup de BD
│       ├─ Logs de auditoría
│       └─ Configurar sucursales
│
```

---

## 📊 RESUMEN: FLUJO COMPLETO

```
┌─────────────────────────────────────────────────────────────┐
│                  ARQUITECTURA COMPLETA                      │
└─────────────────────────────────────────────────────────────┘

USUARIOS (5000+)
    │
    ├─ Registrados vía importación CSV
    ├─ QR único generado automáticamente
    ├─ Contraseña temporal por email
    ├─ Primer login en portal
    └─ Actividad diaria en comedor

                         ▼

CAJEROS
    │
    ├─ Escanean QR del usuario
    ├─ Ven saldo en tiempo real
    ├─ Ingresan monto a cobrar
    ├─ Procesan transacción
    ├─ Generan comprobante
    └─ Sincronización inmediata

                         ▼

ADMIN
    │
    ├─ Ver estadísticas globales
    ├─ Gestionar múltiples sucursales
    ├─ Importar usuarios masivamente
    ├─ Filtrar y buscar usuarios rápidamente
    ├─ Generar reportes
    ├─ Ver desempeño por sucursal
    └─ Auditoría completa

                         ▼

BD (PostgreSQL)
    │
    ├─ 5000+ usuarios indexados
    ├─ Millones de transacciones
    ├─ Búsqueda FULLTEXT rápida
    ├─ Transacciones atómicas
    └─ Backups automáticos

                         ▼

CACHÉ (Redis)
    │
    ├─ Saldos en vivo
    ├─ QR cache
    ├─ Stats sucursales
    ├─ Sessions de usuarios
    └─ Invalidación automática

                         ▼

SINCRONIZACIÓN (WebSocket)
    │
    ├─ Saldo actualizado en vivo
    ├─ Transacciones inmediatas
    ├─ Notificaciones en tiempo real
    ├─ Dashboard actualizado
    └─ Sin necesidad de refrescar

```

---

## 🎯 URLS PRINCIPALES

```
USUARIO
- /login                      → Ingreso
- /dashboard                  → Panel principal
- /dashboard/qr               → Descargar/Imprimir QR
- /recharge/new              → Recargar saldo
- /purchases                 → Historial compras
- /profile                   → Perfil de usuario

CAJERO
- /cashier                   → Dashboard cajero
- /cashier/scan              → Escanear QR
- /cashier/action            → Seleccionar acción (Cobro/Recarga)
- /cashier/charge            → Procesar cobro
- /cashier/recharge          → Procesar recarga
- /cashier/history           → Historial transacciones

ADMIN
- /admin                     → Dashboard admin
- /admin/branches            → Gestión sucursales
- /admin/users               → Gestión usuarios (búsqueda, filtros)
- /admin/users/import        → Importar masivo
- /admin/transactions        → Transacciones
- /admin/reports             → Reportes
- /admin/settings            → Configuración
```

---

**¡Sistema completo listo para producción!** 🚀
