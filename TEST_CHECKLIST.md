# ✅ Test Checklist - Canteen Pay Fase 1

## 🎯 Checklist de Pruebas Funcionales

### 1️⃣ Autenticación

- [ ] **Registro con formulario 2 pasos**
  - [ ] Paso 1: Validar nombre, email, contraseña
  - [ ] Contraseñas no coinciden → mostrar error
  - [ ] Contraseña < 6 caracteres → mostrar error
  - [ ] Paso 1 válido → avanzar a Paso 2
  - [ ] Paso 2: Datos empresa + teléfono
  - [ ] Registro exitoso → ir a dashboard
  - [ ] Email único → si duplicado, mostrar error

- [ ] **Login**
  - [ ] Email + contraseña correctos → login exitoso
  - [ ] Email incorrecto → mostrar error
  - [ ] Contraseña incorrecta → mostrar error
  - [ ] Login exitoso → acceder a dashboard
  - [ ] Token guardado en localStorage

- [ ] **Persistencia de sesión**
  - [ ] Recargar página → mantener sesión
  - [ ] Tokens en localStorage
  - [ ] Cerrar sesión → limpiar tokens

---

### 2️⃣ Panel de Usuario - Dashboard

- [ ] **Carga de datos**
  - [ ] Mostrar nombre de usuario
  - [ ] Mostrar saldo actual en Balance Card
  - [ ] Mostrar últimas 5 transacciones
  - [ ] Mostrar fecha actual

- [ ] **Balance Card**
  - [ ] Diseño hero con gradiente
  - [ ] Saldo con 2 decimales ($XXX.XX)
  - [ ] Nombre de usuario visible
  - [ ] Estado "Activo"

- [ ] **Acciones rápidas**
  - [ ] Botón "Recargar Saldo" → va a /recharges
  - [ ] Botón "Ver Mi QR" → va a /qr
  - [ ] Botón "Estado de Cuenta" → va a /statement

- [ ] **Últimas transacciones**
  - [ ] Mostrar máximo 5
  - [ ] Mostrar tipo, monto, descripción, fecha
  - [ ] Íconos correctos por tipo (compra/recarga/reembolso)
  - [ ] Colores diferenciados (rojo/verde/azul)

---

### 3️⃣ Mi QR

- [ ] **Generación QR**
  - [ ] QR se genera exitosamente
  - [ ] QR legible/escaneable
  - [ ] Datos correctos en QR (UUID del usuario)

- [ ] **Información**
  - [ ] Mostrar nombre de usuario
  - [ ] Mostrar número de empleado
  - [ ] QR centrado en pantalla

- [ ] **Descarga**
  - [ ] Botón "Descargar QR" funciona
  - [ ] Descarga imagen PNG
  - [ ] Nombre archivo: qr-{nombre}.png

- [ ] **Responsive**
  - [ ] QR cabe en mobile (375px)
  - [ ] QR cabe en desktop
  - [ ] Texto legible en ambos

---

### 4️⃣ Mis Compras

- [ ] **Cargar listado**
  - [ ] Mostrar compras paginadas
  - [ ] Pagination controls funcionan
  - [ ] Máximo 20 por página

- [ ] **Items de transacción**
  - [ ] Mostrar ícono (carrito de compras)
  - [ ] Mostrar monto en rojo con signo -
  - [ ] Mostrar descripción
  - [ ] Mostrar fecha/hora
  - [ ] Hover effect

- [ ] **Filtros** (si implementado)
  - [ ] Filtrar por tipo "PURCHASE"
  - [ ] Filtrar por fecha

- [ ] **Vacío**
  - [ ] Si no hay compras, mostrar mensaje

---

### 5️⃣ Recargas

- [ ] **Cargar historial**
  - [ ] Mostrar recargas completadas
  - [ ] Mostrar recargas pendientes
  - [ ] Mostrar recargas fallidas

- [ ] **Métricas**
  - [ ] Total Recargado (suma de completadas)
  - [ ] Recargas Completadas (count)
  - [ ] Promedio (suma / count)

- [ ] **Historial**
  - [ ] Mostrar monto con 2 decimales
  - [ ] Mostrar método (Efectivo/Stripe/MP)
  - [ ] Mostrar estado con badge color
  - [ ] Mostrar fecha

- [ ] **Nueva Recarga**
  - [ ] Botón "Nueva Recarga" visible
  - [ ] Click → navegar a formulario (future)

---

### 6️⃣ Estado de Cuenta

- [ ] **Filtros de fecha**
  - [ ] Input fecha inicial
  - [ ] Input fecha final
  - [ ] Cambiar fechas → actualiza datos
  - [ ] Sin fechas → mostrar todo

- [ ] **Resumen**
  - [ ] Total Transacciones
  - [ ] Total Compras (negativo en rojo)
  - [ ] Total Recargas (positivo en verde)
  - [ ] Total Reembolsos (positivo en azul)

- [ ] **Tabla detallada**
  - [ ] Columnas: Fecha, Concepto, Tipo, Monto, Saldo Anterior, Saldo Nuevo
  - [ ] Mostrar todas las transacciones filtradas
  - [ ] Hover effect en rows
  - [ ] Montos con 2 decimales
  - [ ] Colores por tipo

- [ ] **Auditoría**
  - [ ] Balance anterior + monto = balance nuevo
  - [ ] Verificar cálculos en datos de prueba

---

### 7️⃣ Perfil

- [ ] **Edición datos personales**
  - [ ] Cargar nombre actual
  - [ ] Cargar teléfono actual
  - [ ] Cargar empresa actual
  - [ ] Email disabled (no editable)
  - [ ] Empleado # disabled (no editable)

- [ ] **Guardando cambios**
  - [ ] Cambiar nombre → guardar → actualizar
  - [ ] Cambiar teléfono → guardar → actualizar
  - [ ] Cambiar empresa → guardar → actualizar
  - [ ] Mostrar mensaje "Perfil actualizado"

- [ ] **Cambio de contraseña**
  - [ ] Click "Cambiar Contraseña" → mostrar formulario
  - [ ] Contraseña actual incorrecta → error
  - [ ] Nuevas contraseñas no coinciden → error
  - [ ] Contraseña < 6 caracteres → error
  - [ ] Cambio exitoso → mostrar mensaje
  - [ ] Limpiar formulario después

- [ ] **Seguridad**
  - [ ] No mostrar contraseñas en plain text
  - [ ] Usar inputs tipo password

---

### 8️⃣ Navegación

- [ ] **Desktop**
  - [ ] Sidebar izquierdo visible
  - [ ] Links activos con color esmeralda
  - [ ] Click en nav items → navega correctamente
  - [ ] Logout funciona → ir a login

- [ ] **Mobile**
  - [ ] Bottom navigation visible
  - [ ] Sidebar NO visible en mobile
  - [ ] Hamburger menu funciona
  - [ ] Click en items → navega + cierra menu
  - [ ] Logout funciona

- [ ] **Responsive**
  - [ ] 375px (mobile)
  - [ ] 768px (tablet)
  - [ ] 1024px (desktop)
  - [ ] Transiciones suaves

---

### 9️⃣ Diseño & UX

- [ ] **Colores**
  - [ ] Navy (#0F172A) como base
  - [ ] Esmeralda (#10B981) como accent
  - [ ] Blanco y grises como fondos
  - [ ] Rojo para negativos
  - [ ] Verde para positivos

- [ ] **Glassmorphism**
  - [ ] Cards con bordes suaves
  - [ ] Sombras sutiles
  - [ ] Balance card con gradiente

- [ ] **Tipografía**
  - [ ] Inter font cargada
  - [ ] Tamaños apropiados
  - [ ] Weights (300, 400, 500, 600, 700)

- [ ] **Iconografía**
  - [ ] Lucide icons visibles
  - [ ] Tamaños consistentes
  - [ ] Colores apropiados

---

### 🔟 API & Backend

- [ ] **Health Check**
  - [ ] curl http://localhost:3001/health → {"status":"ok"}

- [ ] **Register Endpoint**
  - [ ] POST /api/auth/register
  - [ ] Devuelve user + accessToken + refreshToken

- [ ] **Login Endpoint**
  - [ ] POST /api/auth/login
  - [ ] Credenciales correctas → tokens
  - [ ] Credenciales incorrectas → 401

- [ ] **Usuarios**
  - [ ] GET /api/users/me → perfil
  - [ ] PUT /api/users/me → actualizar
  - [ ] GET /api/users/me/qr → QR image
  - [ ] PUT /api/users/me/password → cambiar

- [ ] **Transacciones**
  - [ ] GET /api/transactions → lista paginada
  - [ ] GET /api/transactions/summary → resumen
  - [ ] Filtros: type, startDate, endDate, page, limit

- [ ] **JWT Refresh**
  - [ ] POST /api/auth/refresh
  - [ ] Devuelve nuevos tokens

---

### 1️⃣1️⃣ Datos de Prueba

- [ ] **Usuarios**
  - [ ] juan@example.com con $500 saldo
  - [ ] maria@example.com con $250.50 saldo
  - [ ] carlos@example.com (CASHIER)
  - [ ] admin@example.com (ADMIN)

- [ ] **Transacciones de juan**
  - [ ] 1 Recargas de $500
  - [ ] 1 Compra de $45.50
  - [ ] 1 Compra de $32.00
  - [ ] Saldo final debe ser $422.50

- [ ] **Transacciones de maria**
  - [ ] 1 Recarga de $250.50
  - [ ] 1 Compra de $28.75
  - [ ] Saldo final debe ser $221.75

---

### 1️⃣2️⃣ Performance

- [ ] **Carga inicial**
  - [ ] Dashboard carga < 2 segundos
  - [ ] Listados con paginación son rápidos

- [ ] **Interactividad**
  - [ ] Clicks responden instantáneamente
  - [ ] Navegación es fluida
  - [ ] No hay freezes

- [ ] **Memoria**
  - [ ] No hay memory leaks
  - [ ] Componentes se limpian al desmontar

---

## 📝 Notas de Testing

- Usar datos realistas para testing
- Probar en diferentes navegadores (Chrome, Firefox, Safari, Edge)
- Probar en dispositivos reales si es posible
- Verificar console.log no tenga errores
- Verificar Network tab de DevTools no tenga 500s

---

## ✅ Firma de Aprobación

- [ ] Desarrollador revisó código
- [ ] Tester ejecutó checklist
- [ ] Encontrados 0 bugs críticos
- [ ] Encontrados 0 bugs mayores
- [ ] Fase 1 APROBADA

---

**Fecha:** _________  
**Tester:** _________  
**Estado:** ✅ LISTO PARA FASE 2
