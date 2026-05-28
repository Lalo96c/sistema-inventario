# 🚀 Guía de Ambientes - Backend (Laravel)

## Archivos de Configuración

Tu proyecto ahora tiene **3 ambientes separados** + `.env.local` para desarrollo:

| Archivo | Ambiente | Uso | BD |
|---------|----------|-----|-----|
| `.env.development` | Desarrollo | Tu máquina local | `bd_smartcell` (Docker local) |
| `.env.staging` | Pruebas | Servidor de testing | `bd_smartcell_staging` |
| `.env.production` | Producción | Servidor en vivo | `bd_smartcell_prod` |
| `.env.local` | Personal | Tu máquina (NO GIT) | Sobrescribe desarrollo |

---

## 📋 Cómo Usar

### **Desarrollo Local**

Copia `.env.development` como `.env`:
```bash
cp .env.development .env
```

O usa `.env.local` para sobrescribir valores específicos:
```bash
# .env.local
APP_ENV=development
FRONTEND_URL=http://localhost:5173
```

Luego ejecuta:
```bash
# Instalar dependencias
composer install

# Migrar BD
php artisan migrate

# Iniciar servidor
php artisan serve
```

### **Servidor de Pruebas (Staging)**

```bash
# En el servidor de staging, copia:
cp .env.staging .env

# Luego ejecuta:
php artisan migrate --env=staging
php artisan config:cache
php artisan route:cache
```

### **Producción**

```bash
# En el servidor de producción:
cp .env.production .env

# Ejecutar:
php artisan migrate --env=production
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 🔄 Cambios por Ambiente

### **APP_DEBUG**
- ✅ `true` en development
- ✅ `true` en staging (para testing)
- ❌ `false` en production (NUNCA en prod)

### **APP_ENV**
- `development` → desarrollo local
- `staging` → servidor de pruebas
- `production` → servidor en vivo

### **LOG_LEVEL**
- `debug` en desarrollo
- `debug` en staging
- `notice` en producción (menos logs innecesarios)

### **Database**
```
Development:  bd_smartcell     (Docker local)
Staging:      bd_smartcell_staging
Production:   bd_smartcell_prod
```

### **Frontend URL**
```
Development:  http://localhost:5173
Staging:      https://staging-mi-proyecto.onrender.com
Production:   https://mi-proyecto-uvv4.onrender.com
```

---

## ⚠️ IMPORTANTE: Valores Sensibles

### ❌ NUNCA subas a Git:
- `.env` (archivo actual de cualquier servidor)
- `.env.local` (valores locales secretos)

### ✅ Sube a Git estos templates:
- `.env.development` (sin secretos reales)
- `.env.staging` (sin secretos reales)
- `.env.production` (sin secretos reales)

---

## 🔑 Variables que DEBEN Cambiar

### JWT_SECRET
En **producción**, DEBE ser diferente. Genéralo:
```bash
php artisan jwt:secret --env=production
```

### RENIEC_TOKEN
- Desarrollo: Token de prueba ✅
- Staging: Token de staging ⚠️
- Producción: Token real de producción 🔒

### Database Passwords
- Desarrollo: `laravel` / `laravel` (inseguro, solo local)
- Staging: Contraseña fuerte
- Producción: Contraseña muy fuerte + almacenada en secretos del servidor

---

## 🐳 Con Docker

### Desarrollo local con Docker:
```bash
docker-compose up -d

# Ejecutar comandos dentro del contenedor:
docker-compose exec app php artisan migrate
docker-compose exec app php artisan serve
```

### Staging/Producción:
```bash
# Usar docker-compose.prod.yml (por crear)
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📝 Next Steps

### Para completar:
1. **`docker-compose.staging.yml`** - Versión para servidor de staging
2. **`docker-compose.production.yml`** - Versión para producción
3. **GitHub Actions** - Para deploy automático según rama
4. **Secretos en Render/Railway** - Para credenciales en producción

### Comandos útiles:
```bash
# Ver configuración actual
php artisan config:app

# Limpiar cache después de cambiar .env
php artisan config:clear
php artisan cache:clear

# Forzar recargar .env
php artisan config:cache
```

---

## 🎯 Flujo Completo

```
Cambios locales
    ↓
git commit → rama feature/nueva-funcionalidad
    ↓
git push → Pull Request a staging
    ↓
Deploy automático a servidor staging (.env.staging)
    ↓
Pruebas ✅
    ↓
Merge a main
    ↓
Deploy automático a producción (.env.production)
```

¿Necesitas ayuda con la configuración de CI/CD?
