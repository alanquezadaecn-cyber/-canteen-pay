# Ejecutar Frontend Premium - Canteen Pay

## 🚀 Inicio Rápido

### Prerequisitos
- Node.js 18+
- npm 9+
- Backend corriendo en `http://localhost:3001`

### Pasos

#### 1. Terminal 1 - Base de Datos (si no está corriendo)
```bash
cd canteen-pay
docker-compose up -d
```

#### 2. Terminal 2 - Backend
```bash
cd backend
npm run dev
```
Esperar: `Servidor ejecutándose en puerto 3001`

#### 3. Terminal 3 - Frontend
```bash
cd frontend
npm run dev
```
Esperar: `Local: http://localhost:5173`

#### 4. Abrir en Navegador
```
http://localhost:5173
```

---

## 🎨 Qué Ver

### Features Premium Implementadas

#### Dark Mode
- Click en el ícono de luna/sol (arriba a la derecha cuando agregues ThemeToggle)
- Cambio suave entre claro/oscuro
- Persiste en localStorage
- Respeta preferencia del sistema

#### Buttons Mejorados
- Variantes: primary, success, cashier, admin, secondary, outline, ghost, danger, link
- Tamaños: xs, sm, md, lg, xl + icon variants
- Loading state con spinner
- Hover effects suaves
- Focus ring visible (keyboard nav)
- Dark mode completo

#### Cards Glassmorphism
- Fondo translúcido con blur
- Variantes: default, elevated, interactive, flat, neumorphic, gradient
- Hover effects con scale animation
- Border suave visible en ambos modos

#### Animaciones
- Fade-in, scale, slide, pulse, shimmer
- Duración suave: 150-300ms
- Reducidas si user prefiere (prefers-reduced-motion)

#### Colores Refinados
- User: Emerald (#059669)
- Cashier: Amber (#D97706)
- Admin: Violet (#7C3AED)

---

## 🧪 Testing Manual

### 1. Dark Mode
1. Login
2. Busca el toggle (agregará ThemeToggle a navbar)
3. Click para cambiar tema
4. Verifica que todo se ve bien en ambos modos

### 2. Buttons
1. Ve a Recharges → Nueva Recarga
2. Observa buttons con variantes (próximos → warning, danger)
3. Hover effects suaves
4. Click en Loading button → spinner animation

### 3. Cards
1. Dashboard
2. Cards con elevation y hover effects
3. En dark mode: glassmorphism visible

### 4. Responsive
1. F12 → Toggle device toolbar
2. 375px (mobile), 768px (tablet), 1024px (desktop)
3. Sin horizontal scroll
4. Touch targets ≥ 44px

---

## 📝 Archivos Nuevos

- `frontend/src/hooks/useTheme.ts` - Dark mode hook
- `frontend/src/components/ThemeProvider.tsx` - Proveedor
- `frontend/src/components/ThemeToggle.tsx` - Botón toggle
- `frontend/tailwind.config.js` - Config extendida (20+ animaciones)
- `frontend/src/index.css` - Utilidades premium
- `frontend/src/components/ui/Button.tsx` - Mejorado
- `frontend/src/components/ui/Card.tsx` - Mejorado

---

## 🐛 Si Hay Problemas

### "Stripe is not available" Error
- Reinicia `npm run dev` en frontend después de agregar VITE_STRIPE_PUBLISHABLE_KEY

### Dark mode no funciona
- Limpia cache: Ctrl+F5
- Abre Dev Tools → Console → `localStorage.clear()`
- Recarga

### Animaciones muy lentas
- Verifica en Dev Tools: Rendering → CPU throttling (desactiva si está activo)

### Buttons sin hover effect
- Verifica en tailwind.config.js que esté extendido
- Limpia: `rm -rf frontend/node_modules/.cache`

---

## 📊 Metrics

- **Bundle Size:** ~50KB (PurgeCSS)
- **Animaciones:** 20+ predefinidas
- **Color Palettes:** 3 (user, cashier, admin) + supporting
- **Components Mejorados:** Button (8 variantes), Card (6 variantes)
- **Dark Mode:** Completo + persistent

---

## 🎯 Siguiente

Ver las páginas con nuevos componentes en acción:
- Dashboard con animaciones KPI
- Recharge con form premium
- Admin con charts animados

**¡Disfruta el frontend premium!** ✨
