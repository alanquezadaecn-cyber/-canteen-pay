# Quick Start - Fase 4 en 5 Minutos

## ⚡ Setup Rápido

### 1️⃣ Obtener Claves (2 min)

**Stripe:**
- Ir a https://dashboard.stripe.com/register (crear cuenta)
- Developers → API Keys
- Copiar `sk_test_...` y `pk_test_...`

**MercadoPago:**
- Ir a https://www.mercadopago.com.mx/developers/panel
- Copiar `APP_USR_...` (Access Token y Public Key)

### 2️⃣ Configurar .env (1 min)

**`backend/.env` - Agregar:**
```env
STRIPE_SECRET_KEY=sk_test_AQUI_TU_CLAVE
STRIPE_WEBHOOK_SECRET=whsec_test_AQUI_TU_WEBHOOK_SECRET
MP_ACCESS_TOKEN=APP_USR_AQUI_TU_TOKEN
MP_PUBLIC_KEY=APP_USR_AQUI_TU_PUBLIC
API_URL=http://localhost:3001
```

**`frontend/.env` - Actualizar:**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_AQUI_TU_CLAVE
```

### 3️⃣ Instalar (1 min)

```bash
cd frontend && npm install
```

### 4️⃣ Ejecutar (1 min)

**Terminal 1:**
```bash
docker-compose up -d  # Solo si BD no está corriendo
```

**Terminal 2:**
```bash
cd backend && npm run dev
```

**Terminal 3 (Opcional pero recomendado para Stripe):**
```bash
# Instalar Stripe CLI primero si no lo tienes:
# Windows: descargar de https://github.com/stripe/stripe-cli/releases
# macOS: brew install stripe

stripe login
stripe listen --forward-to localhost:3001/api/payments/stripe/webhook
# Copiar el whsec_ y ponerlo en backend/.env STRIPE_WEBHOOK_SECRET
# Reiniciar Terminal 2
```

**Terminal 4:**
```bash
cd frontend && npm run dev
```

**Abrir:** http://localhost:5173

---

## 🧪 Probar en 30 Segundos

### Test 1: Stripe
1. Login (juan@example.com / password123)
2. Recargas → Nueva Recarga
3. Seleccionar $100 → Siguiente
4. Tarjeta → Ingresar: `4242 4242 4242 4242` | `12/34` | `123`
5. Pagar
6. ✅ Ver nuevo saldo

### Test 2: MercadoPago
1. Recargas → Nueva Recarga
2. Seleccionar $200 → Siguiente
3. MercadoPago → Pagar
4. En MP, completar con tarjeta de prueba
5. ✅ Ver nuevo saldo

### Test 3: Efectivo
1. Recargas → Nueva Recarga
2. Seleccionar $150 → Siguiente
3. Efectivo en Caja
4. Ir a caja (en otra ventana login como carlos@example.com)
5. Cajero: Escanear QR → Recarga → $150 → Procesar
6. ✅ Usuario ve saldo actualizado

---

## 📚 Documentación

| Archivo | Para Qué |
|---------|----------|
| `CHECKLIST_FASE_4.md` | Testing detallado y troubleshooting |
| `FASE_4_SETUP.md` | Configuración paso a paso |
| `FASE_4_SUMMARY.md` | Resumen técnico completo |

---

## ❓ Si Algo Falla

### Error: "Stripe is not available"
→ Reiniciar `npm run dev` en frontend después de actualizar .env

### Error: "Webhook signature failed"
→ Copiar exactamente el `whsec_` de `stripe listen` a backend/.env y reiniciar

### Pago completado pero saldo no actualiza
→ Hacer F5 en Dashboard (o esperar 3 segundos)

### MercadoPago redirect a /payment/failed
→ Verificar que `API_URL=http://localhost:3001` está en backend/.env

---

**¡Listo! Fase 4 completada y funcionando.** 🎉
