# 🔐 Obtener Token Railway

## Pasos Rápidos

### 1. Generar Token
```
1. Ve a: https://railway.app/account/tokens
2. Click "Create New Token"
3. Dale nombre: canteen-pay-deployment
4. Click "Create"
5. COPIAR el token (comienza con eyJ...)
```

### 2. Guardar Token Temporalmente
```bash
# En PowerShell, ejecuta:
$env:RAILWAY_TOKEN = "eyJ..."  # Reemplaza con tu token

# Verificar que se guardó:
echo $env:RAILWAY_TOKEN
```

### 3. Hacer Deploy
```bash
cd C:\Users\Alan\canteen-pay
railway link --project 0d64a1b5-c17c-450a-ac01-78ac52ec8bd2
railway up
```

---

## Token Guardado Permanentemente (Opcional)

Si quieres que persista entre sesiones:

```powershell
# Abrir PowerShell como Admin
# Luego:
[Environment]::SetEnvironmentVariable("RAILWAY_TOKEN", "eyJ...", "User")

# Cerrar y abrir PowerShell de nuevo
# El token se recordará automáticamente
```

---

## Verificar Deploy

```bash
railway logs --tail 50
railway status
```

---

¿Ya tienes tu token de Railway?
