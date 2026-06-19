# Checklist - Fase 4 Completada: Pagos Reales

## ✅ Implementación Completada

### Backend
- [x] `backend/src/routes/payments.js` - Rutas y webhooks para Stripe y MercadoPago
- [x] `backend/src/services/stripe.service.js` - Cliente de Stripe
- [x] `backend/src/services/mp.service.js` - Cliente de MercadoPago
- [x] `backend/src/app.js` - Middleware raw para Stripe + registro de ruta /api/payments
- [x] `backend/prisma/schema.prisma` - Actualizado con status en Transaction y reference en Recharge

### Frontend
- [x] `frontend/src/pages/user/RechargeNew.tsx` - Flujo completo de recarga (2 pasos)
- [x] `frontend/src/components/StripeForm.tsx` - Formulario embebido de Stripe Elements
- [x] `frontend/src/pages/user/PaymentSuccess.tsx` - Página de éxito
- [x] `frontend/src/pages/user/PaymentFailed.tsx` - Página de error
- [x] `frontend/src/App.tsx` - 3 nuevas rutas agregadas
- [x] `frontend/src/pages/user/Recharges.tsx` - Botón "Nueva Recarga" agregado
- [x] `frontend/package.json` - Dependencias @stripe/stripe-js y @stripe/react-stripe-js

### Configuración
- [x] `backend/.env` - Variables STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, MP_ACCESS_TOKEN, MP_PUBLIC_KEY, API_URL
- [x] `frontend/.env` - Variable VITE_STRIPE_PUBLISHABLE_KEY

### Documentación
- [x] `FASE_4_SETUP.md` - Guía completa de configuración y testing

---

## 📋 Pasos Previos a Testing

### 1. Instalar Dependencias Frontend
```bash
cd frontend
npm install
```
Esto debe instalar:
- `@stripe/stripe-js` ^2.0.0
- `@stripe/react-stripe-js` ^2.0.0

**Verificar:**
```bash
npm list @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Obtener Claves de Pago (Sandbox)

#### Stripe
1. Ir a https://dashboard.stripe.com/register
2. Crear cuenta o login
3. Ir a Developers → API Keys
4. Copiar **Secret Key** (comienza con `sk_test_`)
5. Copiar **Publishable Key** (comienza con `pk_test_`)

**Actualizar:**
- `backend/.env`: STRIPE_SECRET_KEY=sk_test_XXXX
- `frontend/.env`: VITE_STRIPE_PUBLISHABLE_KEY=pk_test_XXXX

#### MercadoPago
1. Ir a https://www.mercadopago.com.mx/developers/panel
2. Login con cuenta (crear si es necesario)
3. Ir a Credenciales
4. Copiar **Access Token** (comienza con `APP_USR_`)
5. Copiar **Public Key** (comienza con `APP_USR_`)

**Actualizar:**
- `backend/.env`: 
  - MP_ACCESS_TOKEN=APP_USR_XXXX
  - MP_PUBLIC_KEY=APP_USR_XXXX

### 3. Configurar Stripe Webhook Secret

**Opción A: Para Testing Local (Recomendado)**
```bash
# Instalar Stripe CLI (si no está instalado)
# Windows: descargar de https://github.com/stripe/stripe-cli/releases
# O con chocolatey: choco install stripe

# Autenticar
stripe login

# En una terminal separada, ejecutar:
stripe listen --forward-to localhost:3001/api/payments/stripe/webhook
```

Output esperado:
```
> Ready! Your webhook signing secret is: whsec_test_XXXXXXXXXXXX
```

Copiar el `whsec_test_XXXX` a `backend/.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_test_XXXX
```

**Opción B: Para Producción**
1. En Stripe Dashboard → Webhooks → Add Endpoint
2. URL: `https://tu-dominio.com/api/payments/stripe/webhook`
3. Copiar el signing secret generado

### 4. Verificar URLs en .env

**backend/.env debe tener:**
```
API_URL=http://localhost:3001
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
MP_ACCESS_TOKEN=APP_USR_...
MP_PUBLIC_KEY=APP_USR_...
```

**frontend/.env debe tener:**
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:3001
```

---

## 🧪 Testing Manual - Guía Paso a Paso

### Terminal 1: Base de Datos (si no está corriendo)
```bash
docker-compose up -d
```

### Terminal 2: Backend
```bash
cd backend
npm run dev
```
**Esperar:** "Servidor ejecutándose en puerto 3001"

### Terminal 3: Stripe CLI Webhook (Solo si quieres probar Stripe)
```bash
stripe listen --forward-to localhost:3001/api/payments/stripe/webhook
```
**Copiar** el `whsec_` a `backend/.env` y reiniciar terminal 2.

### Terminal 4: Frontend
```bash
cd frontend
npm run dev
```
**Abrir:** http://localhost:5173

---

## 🧪 Test Case 1: Recargar con Tarjeta (Stripe)

**Precondición:** Usuario logueado

**Pasos:**
1. Ir a **Recargas** (en AppNav)
2. Click en botón **Nueva Recarga**
3. Seleccionar **$100** (o ingresar monto personalizado)
4. Click **Siguiente**
5. Seleccionar **Tarjeta de Crédito/Débito**
6. En formulario de tarjeta ingresar:
   ```
   Número: 4242 4242 4242 4242
   Expiración: 12/34
   CVV: 123
   ```
7. Click **Pagar $100.00**
8. Esperar confirmación (2-3 segundos)
9. Página de éxito con nuevo saldo
10. Click **Ver Mi Saldo**
11. En Dashboard, verificar que balance aumentó $100

**Verificación en Logs:**
```
Backend debe mostrar:
  POST /api/payments/stripe/create-intent 200
  POST /api/payments/stripe/webhook 200

Stripe CLI debe mostrar:
  > charge.succeeded
  > payment_intent.succeeded
```

**BD:**
```sql
SELECT * FROM "Recharge" WHERE "paymentMethod"='STRIPE' ORDER BY "createdAt" DESC LIMIT 1;
SELECT * FROM "Transaction" WHERE "paymentMethod"='STRIPE' ORDER BY "createdAt" DESC LIMIT 1;
SELECT "balance" FROM "User" WHERE "email"='tu@email.com';
```

---

## 🧪 Test Case 2: Recargar con MercadoPago

**Precondición:** Usuario logueado, claves MP configuradas

**Pasos:**
1. Ir a **Recargas**
2. Click **Nueva Recarga**
3. Seleccionar **$200**
4. Click **Siguiente**
5. Seleccionar **MercadoPago**
6. Click **Pagar $200.00 con MercadoPago**
7. Serás redirigido a MP Checkout (sandbox)
8. En MP, seleccionar tarjeta de prueba:
   ```
   Número: 4111 1111 1111 1111
   Expiración: 12/25
   CVV: 123
   ```
9. Completar el pago
10. MP redirige a `/payment/success`
11. Página muestra nuevo saldo
12. Ir a Dashboard y verificar balance

**Verificación en Logs:**
```
Backend debe mostrar:
  POST /api/payments/mp/create-preference 200
  POST /api/payments/mp/webhook 200
```

---

## 🧪 Test Case 3: Recargar en Efectivo

**Precondición:** Dos dispositivos o dos navegadores (usuario + cajero)

**Pasos Usuario:**
1. Ir a **Recargas**
2. Click **Nueva Recarga**
3. Seleccionar $150
4. Click **Siguiente**
5. Seleccionar **Efectivo en Caja**
6. Mensaje informativo
7. Click **Cerrar** (ir a caja)

**Pasos Cajero (mismo sistema):**
1. Login como cajero (carlos@example.com / password123)
2. Ir a **Escanear QR**
3. Permitir acceso a cámara
4. Escanear QR del usuario (o ingresar manualmente)
5. Click **Continuar**
6. Click **Recarga** (en ActionSelector)
7. Ingresar monto: 150
8. Click **Procesar Recarga**
9. Página de éxito

**Verificación:**
- Usuario actualiza Dashboard → saldo aumentó $150
- En Recharges → nuevo registro con método "Efectivo en caja"

---

## 📊 SQL Queries para Verificación

### Ver todas las recargas recientes
```sql
SELECT 
  r.id,
  r."userId",
  u.name,
  r.amount,
  r."paymentMethod",
  r.status,
  r."createdAt"
FROM "Recharge" r
JOIN "User" u ON r."userId" = u.id
ORDER BY r."createdAt" DESC
LIMIT 10;
```

### Ver transacciones de pago recientes
```sql
SELECT 
  t.id,
  t."userId",
  u.name,
  t.type,
  t.amount,
  t."paymentMethod",
  t.status,
  t."createdAt"
FROM "Transaction" t
JOIN "User" u ON t."userId" = u.id
WHERE t.type = 'RECHARGE'
ORDER BY t."createdAt" DESC
LIMIT 10;
```

### Ver balance de un usuario
```sql
SELECT name, email, balance FROM "User" WHERE email='juan@example.com';
```

---

## ⚠️ Troubleshooting

### Error: "VITE_STRIPE_PUBLISHABLE_KEY is not defined"
- Verificar que `frontend/.env` tiene `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...`
- Reiniciar servidor frontend (`npm run dev`)

### Error: "Stripe is not available in Elements"
- Verificar que loadStripe() tiene la clave correcta
- Verificar que StripeForm está dentro del context del archivo RechargeNew

### Pago completado pero saldo no actualiza
- Verificar que webhook de Stripe está corriendo (`stripe listen` output)
- En Backend: logs muestran POST /api/payments/stripe/webhook 200?
- Hacer polling manual: F5 en Dashboard

### Error de firma webhook: "Invalid signature"
- Copiar exactamente el `whsec_` que mostró `stripe listen`
- Asegurarse de reiniciar backend después de actualizar .env
- Si sigue fallando, generar nuevo webhook en Stripe Dashboard

### MercadoPago redirige a /payment/failed
- Verificar que `API_URL` en backend es correcto
- En desarrollo, verificar que `stripe listen` (si lo usas) no interfiere
- Si usas ngrok, actualizar las URLs en .env

### BD: Error "column status does not exist"
- Ejecutar migración de Prisma:
```bash
cd backend
npx prisma migrate dev --name add_transaction_status
```

---

## 📝 Notas Importantes

1. **Moneda:** Todos los montos están en MXN (pesos mexicanos)
2. **Precisión:** Decimal(10,2) en BD para exactitud monetaria
3. **Webhooks:** Solo se actualizan saldos si webhook es recibido y verificado
4. **Idempotencia:** Si webhook se recibe dos veces, solo una vez actualiza (por status check)
5. **Testing:** Usar tarjetas de prueba, NUNCA tarjetas reales en sandbox

---

## ✅ Marcar como Completado

Una vez que hayas:
- [x] Instalado dependencias frontend
- [x] Configurado todas las claves en .env
- [x] Ejecutado Test Case 1 (Stripe)
- [x] Ejecutado Test Case 2 (MercadoPago)
- [x] Ejecutado Test Case 3 (Efectivo)
- [x] Verificado BD con SQL queries
- [x] Revisado logs de Backend y Stripe CLI

Fase 4 está **LISTA PARA PRODUCCIÓN** (con claves live en lugar de test).

---

## 🚀 Deploy a Producción

### 1. Actualizar Claves
```bash
# backend/.env
STRIPE_SECRET_KEY=sk_live_XXXXXXX        # cambiar de test a live
STRIPE_WEBHOOK_SECRET=whsec_live_XXXXX   # del dashboard de producción
MP_ACCESS_TOKEN=APP_USR_PRODUCTION_XXXXX
API_URL=https://tu-app-production.com
```

### 2. Configurar Webhooks en Producción
- Stripe Dashboard: Webhooks → Add Endpoint → https://tu-app/api/payments/stripe/webhook
- MercadoPago: Configurar IPN URL → https://tu-app/api/payments/mp/webhook

### 3. Deploy
```bash
# Si usas Railway:
git push origin main
# Railway auto-deploya

# Si usas otra plataforma, seguir sus instrucciones de deploy
```

¡Fase 4 completada! 🎉
