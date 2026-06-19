# Fase 4: Pagos Reales (Stripe + MercadoPago) - Guía de Configuración

## Descripción General

Fase 4 integra **Stripe** y **MercadoPago** como pasarelas de pago reales para recargas de saldo. Los usuarios pueden elegir entre:
- **Tarjeta de Crédito/Débito (Stripe)** - Formulario embebido con Stripe Elements
- **MercadoPago** - Checkout con redirección a MP
- **Efectivo en Caja** - Ya existente desde Fase 2

Los webhooks actualizan el saldo automáticamente cuando el pago es confirmado.

---

## Archivos Nuevos Creados

### Backend
```
backend/src/routes/payments.js          ← Rutas de pagos y webhooks
backend/src/services/stripe.service.js  ← Configuración de Stripe
backend/src/services/mp.service.js      ← Configuración de MercadoPago
```

### Frontend
```
frontend/src/pages/user/RechargeNew.tsx         ← Flujo completo (2 pasos)
frontend/src/pages/user/PaymentSuccess.tsx     ← Página de éxito
frontend/src/pages/user/PaymentFailed.tsx      ← Página de error
frontend/src/components/StripeForm.tsx         ← Formulario de tarjeta
```

---

## Archivos Modificados

### Backend
- `backend/src/app.js` - Agregado middleware raw para Stripe + ruta /api/payments

### Frontend
- `frontend/src/App.tsx` - Agregadas rutas /recharge/new, /payment/success, /payment/failed
- `frontend/src/pages/user/Recharges.tsx` - Botón "Nueva Recarga" → /recharge/new
- `frontend/package.json` - Agregadas dependencias @stripe/stripe-js y @stripe/react-stripe-js

### Configuración
- `backend/.env` - STRIPE_WEBHOOK_SECRET, MP_PUBLIC_KEY, API_URL
- `frontend/.env` - VITE_STRIPE_PUBLISHABLE_KEY (ya existía)

---

## Configuración Paso a Paso

### 1. Obtener Claves de Stripe

1. Ir a [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Registrarse o iniciar sesión
3. Ir a **Developers** → **API Keys**
4. Copiar **Secret Key** (comienza con `sk_test_`)
5. En la misma página, ir a **Webhooks**
6. Hacer clic en **Add endpoint**
7. Para desarrollo local: usar [Stripe CLI](#configurar-stripe-cli-para-webhooks-locales)
8. Para producción: URL será `https://tu-app.com/api/payments/stripe/webhook`

**Variables de entorno (backend/.env):**
```
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXX
```

**Variable de entorno (frontend/.env):**
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXX
```

---

### 2. Obtener Claves de MercadoPago

1. Ir a [https://www.mercadopago.com.mx/](https://www.mercadopago.com.mx/)
2. Crear una cuenta o iniciar sesión
3. Ir a **Configuración** → **Credenciales** o [https://www.mercadopago.com.mx/developers/panel](https://www.mercadopago.com.mx/developers/panel)
4. Copiar **Access Token** (sandbox o producción)
5. Copiar **Public Key**

**Variables de entorno (backend/.env):**
```
MP_ACCESS_TOKEN=APP_USR_XXXXXXXXXXXX
MP_PUBLIC_KEY=APP_USR_XXXXXXXXXXXX
API_URL=http://localhost:3001
```

---

### 3. Instalar Dependencias Frontend

```bash
cd frontend
npm install
```

Esto instala:
- `@stripe/stripe-js` - Librería de Stripe para JavaScript
- `@stripe/react-stripe-js` - Componentes React para Stripe

---

### 4. Actualizar Variables de Entorno

#### Backend (`backend/.env`)
Reemplazar los placeholders:

```env
DATABASE_URL="postgresql://..."  # Ya existía

JWT_SECRET="..."
JWT_EXPIRE_IN="1h"
JWT_REFRESH_EXPIRE_IN="7d"

PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"

# Stripe
STRIPE_SECRET_KEY="sk_test_XXXXXXXXXXXX"
STRIPE_WEBHOOK_SECRET="whsec_XXXXXXXXXXXX"

# MercadoPago
MP_ACCESS_TOKEN="APP_USR_XXXXXXXXXXXX"
MP_PUBLIC_KEY="APP_USR_XXXXXXXXXXXX"

# URL pública para webhooks
API_URL="http://localhost:3001"
```

#### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3001
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXX
```

---

## Flujo de Uso

### Usuario: Recargar con Tarjeta (Stripe)

1. Dashboard → Recargas → **Nueva Recarga**
2. Seleccionar monto ($50, $100, $200, $500 o personalizado)
3. Botón **Siguiente**
4. Elegir **Tarjeta de Crédito/Débito**
5. Ingresar datos: N° tarjeta, fecha, CVV
6. Botón **Pagar**
7. Página de éxito con nuevo saldo ✅

### Usuario: Recargar con MercadoPago

1. Dashboard → Recargas → **Nueva Recarga**
2. Seleccionar monto
3. Botón **Siguiente**
4. Elegir **MercadoPago**
5. Botón **Pagar con MercadoPago**
6. Redirección a checkout de MP
7. Ingresar tarjeta o billetera MP
8. MP redirige a `/payment/success`
9. Saldo actualizado automáticamente ✅

### Usuario: Recargar en Efectivo

1. Dashboard → Recargas → **Nueva Recarga**
2. Seleccionar monto
3. Botón **Siguiente**
4. Elegir **Efectivo en Caja**
5. Mensaje informativo
6. Ir a la caja del comedor
7. Cajero escanea QR y procesa recarga
8. Saldo actualizado en tiempo real ✅

---

## Testing - Tarjetas de Prueba

### Stripe (modo sandbox)
```
Número: 4242 4242 4242 4242
Expiración: 12/34 (cualquier fecha futura)
CVV: 123 (cualquier 3 dígitos)
Resultado: ✅ APROBADO
```

Para rechazar el pago:
```
Número: 4000 0000 0000 0002
```

**[Más tarjetas de prueba Stripe](https://stripe.com/docs/testing)**

### MercadoPago (sandbox)

1. Ir a [https://sandbox.mercadopago.com.mx/](https://sandbox.mercadopago.com.mx/)
2. Usar credenciales de sandbox
3. En checkout de MP aparecerán opciones de pago de prueba
4. Usar tarjeta de prueba MP:
   ```
   Número: 4111 1111 1111 1111
   Expiración: 12/25
   CVV: 123
   ```

---

## Configurar Stripe CLI para Webhooks Locales

Para probar webhooks en desarrollo local:

### 1. Instalar Stripe CLI

**En Windows (PowerShell):**
```powershell
# Descargar desde: https://github.com/stripe/stripe-cli/releases
# O usar Chocolatey si está instalado:
choco install stripe
```

**En macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**En Linux:**
```bash
curl https://files.stripe.com/stripe-cli/install.sh -o install.sh && bash install.sh
```

### 2. Autenticar con tu cuenta Stripe

```bash
stripe login
```

Se abrirá un navegador para autenticar tu cuenta de Stripe.

### 3. Escuchar Webhooks Locales

Ejecutar en una terminal mientras el backend está corriendo:

```bash
stripe listen --forward-to localhost:3001/api/payments/stripe/webhook
```

**Output esperado:**
```
> Ready! Your webhook signing secret is: whsec_test_XXXXXXXXXXXX
> Ready to accept incoming requests from Stripe
```

Copiar el `whsec_test_XXXXXXXXXXXX` a `STRIPE_WEBHOOK_SECRET` en `.env`

### 4. Disparar Eventos de Prueba

En otra terminal:

```bash
# Simular un pago exitoso
stripe trigger payment_intent.succeeded

# Simular un pago fallido
stripe trigger payment_intent.payment_failed
```

El servidor verá los webhooks en los logs:
```
POST /api/payments/stripe/webhook - 200 OK
```

---

## Testing Manual

### 1. Backend en desarrollo

```bash
cd backend
npm run dev
```

Debe ver:
```
Servidor ejecutándose en puerto 3001
```

### 2. Frontend en desarrollo

```bash
cd frontend
npm run dev
```

Debe ver:
```
Local:   http://localhost:5173
```

### 3. Probar Flujo Completo

1. Abrir [http://localhost:5173/register](http://localhost:5173/register)
2. Registrarse con un usuario (rol USER automáticamente)
3. Login
4. Dashboard → Recargas → Nueva Recarga
5. Seleccionar $100 → Siguiente
6. Elegir Tarjeta → Ingresar `4242 4242 4242 4242`
7. Pagar
8. Esperar webhook (si está corriendo Stripe CLI)
9. Verificar que el saldo aumentó en el Dashboard ✅

### 4. Probar MercadoPago

1. Dashboard → Recargas → Nueva Recarga
2. Seleccionar $200 → Siguiente
3. Elegir MercadoPago
4. Pagar con MercadoPago
5. En sandbox, completar el pago
6. Verificar que MP redirige a `/payment/success` ✅
7. Saldo debe estar actualizado

---

## Detalles Técnicos

### Flujo de Pago Stripe

```
Frontend                    Backend                 Stripe
  │                           │                        │
  ├─POST /stripe/create-intent──→ Crear Recharge      │
  │                           │                        │
  │                           ├─────stripe.paymentIntents.create──→
  │                           │                        │
  │  ← clientSecret ──────────┤ ← response ────────────┤
  │
  ├─stripe.confirmCardPayment────→ (directamente a Stripe)
  │                                                    │
  │ ← paymentIntent.succeeded ──────────────────────┐ │
  │                                                 │ │
  │                           ← webhook ────────────┘ │
  │                           │
  │                           ├─ Actualizar Recharge status=COMPLETED
  │                           ├─ Incrementar balance
  │                           ├─ Crear Transaction
  │
  │ ← redirect /payment/success ──────────────────────┤
  │
  └─ GET /users/me para obtener nuevo saldo
```

### Flujo de Pago MercadoPago

```
Frontend                Backend                 MercadoPago
  │                       │                          │
  ├─POST /mp/create-preference──→ Crear Recharge   │
  │                       │                          │
  │                       ├─preferences.create───────→
  │                       │                          │
  │  ← init_point ────────┤ ← response ────────────┤
  │
  ├─window.location.href init_point──────────────────→
  │                                                  │
  │ ← redirect success_url ───────────────────────┐  │
  │ (MP redirige a /api/payments/mp/success)     │  │
  │                                                │  │
  │                       ← webhook (IPN) ───────────┘
  │                       │
  │                       ├─ Validar payment ID
  │                       ├─ Actualizar Recharge
  │                       ├─ Incrementar balance
  │                       ├─ Crear Transaction
  │
  │ ← redirect /payment/success ──────────────────────┤
```

### Seguridad

- ✅ Webhooks Stripe: Signature verification con `stripe.webhooks.constructEvent()`
- ✅ Webhooks MP: Consulta directa a API de MP (no confiar en body)
- ✅ Balance updates: Solo desde webhooks, nunca desde frontend
- ✅ Idempotencia: Verificar `Recharge.status` antes de actualizar
- ✅ Transacciones atómicas: `Prisma.$transaction()` para consistency

---

## Producción

### Deploy en Railway/Vercel/Render

1. **Actualizar `API_URL` en backend/.env:**
   ```
   API_URL=https://tu-app.railway.app
   ```

2. **Configurar Stripe Webhook en Dashboard:**
   - Ir a **Webhooks** → **Add endpoint**
   - URL: `https://tu-app.railway.app/api/payments/stripe/webhook`
   - Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`

3. **Configurar MercadoPago Webhook:**
   - En MercadoPago dashboard, configurar IPN URL:
   - URL: `https://tu-app.railway.app/api/payments/mp/webhook`

4. **Usar claves de PRODUCCIÓN:**
   - Stripe: cambiar de `sk_test_` a `sk_live_`
   - MercadoPago: cambiar de `APP_USR_TEST_` a `APP_USR_`

---

## Troubleshooting

### Error: "Stripe is not available"
- Verificar que `VITE_STRIPE_PUBLISHABLE_KEY` está en `frontend/.env`
- Recargar página del navegador

### Error: "Webhook signature verification failed"
- Verificar que `STRIPE_WEBHOOK_SECRET` es correcto
- Si está usando Stripe CLI, copiar exactamente el `whsec_...` que se mostró

### Pago completado pero saldo no actualiza
- Verificar que el webhook está siendo procesado (logs del backend)
- En desarrollo, verificar que `stripe listen` sigue corriendo
- Hacer polling manual: ir a Dashboard y actualizar página (F5)

### MercadoPago redirect a /payment/failed
- Verificar que `API_URL` en backend es correctamente accesible desde MP
- En desarrollo, usar `stripe listen` o ngrok para exponer localhost

### "API connection error" en webhook
- Verificar que el servidor backend está corriendo
- Verificar que `API_URL` es correcto y accesible

---

## Próximos Pasos

Después de Fase 4, el sistema tiene:

- ✅ Autenticación con JWT (Fase 1)
- ✅ Panel de usuario con QR y transacciones (Fase 1)
- ✅ Panel de cajero con scanner y recargas en efectivo (Fase 2)
- ✅ Panel de admin con usuarios y reportes (Fase 3)
- ✅ Pagos reales con Stripe y MercadoPago (Fase 4)

Opcionales:
- Email transaccionales (Brevo/SendGrid)
- Notificaciones push
- Refinamiento de UI/UX
- Tests automatizados
