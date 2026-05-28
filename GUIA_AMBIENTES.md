# 🚀 Guía de Ambientes - Pruebas vs Producción

## Estructura de Ambientes

Tu proyecto ahora tiene **3 ambientes separados**:

### 1️⃣ **DESARROLLO (Development)**
- **Uso**: Tu máquina local
- **Archivo**: `.env.development` / `.env.local`
- **URL Backend**: `http://localhost:8000/api`
- **Comando**: `npm run dev`
- **Build**: `npm run build:development`

### 2️⃣ **PRUEBAS (Staging)**
- **Uso**: Servidor de pruebas antes de producción
- **Archivo**: `.env.staging`
- **URL Backend**: `https://staging-mi-proyecto.onrender.com/api`
- **Comando**: `npm run dev:staging`
- **Build**: `npm run build:staging`

### 3️⃣ **PRODUCCIÓN (Production)**
- **Uso**: Servidor en vivo para usuarios finales
- **Archivo**: `.env.production`
- **URL Backend**: `https://mi-proyecto-uvv4.onrender.com/api`
- **Build**: `npm run build` (default)

---

## 📋 Cómo Usar

### Para **Desarrollo Local**:
```bash
npm run dev
```
Usará `.env.local` o `.env.development`

### Para **Pruebas en Staging**:
```bash
npm run dev:staging
```
Conectará al servidor de staging

### Para **Build a Producción**:
```bash
npm run build
```
Creará el build con `.env.production`

### Para **Build a Staging**:
```bash
npm run build:staging
```
Creará el build con `.env.staging`

---

## 🌳 Estrategia de Ramas Git

```
main/master
  ↓ (producción)
  ├─ Automáticamente deploya a producción
  └─ Protegida: requiere review antes de merge

staging/develop
  ↓ (pruebas)
  ├─ Automáticamente deploya a staging
  └─ Rama para testing

feature/nombre-feature
  ↓ (desarrollo)
  ├─ Tu rama local de trabajo
  └─ PR a staging cuando está lista para pruebas
```

### Flujo típico:
1. Creas rama `feature/nueva-funcionalidad` desde `develop`
2. Trabajas localmente con `npm run dev`
3. Haces PR a `staging` para pruebas
4. Una vez probado, haces PR a `main` para producción

---

## 🔄 Flujo de Deploy Automático

Para automatizar, configura **GitHub Actions** o **GitLab CI**:

### Cuando haces Push a `staging`:
- ✅ Corre tests
- ✅ Genera build con `npm run build:staging`
- ✅ Deploya a servidor de staging

### Cuando haces Push a `main`:
- ✅ Corre tests
- ✅ Genera build con `npm run build`
- ✅ Deploya a servidor de producción

---

## ⚠️ Reglas Importantes

### ✅ Sube a Git:
- `.env.development`
- `.env.staging`
- `.env.production`
- `.gitignore` (con `*.local`)

### ❌ NUNCA subas a Git:
- `.env.local` (variables secretas de tu máquina)
- Cualquier archivo con credenciales reales

---

## 🔑 Variables Sensibles

Si tienes API keys o contraseñas:

### Opción 1: Variables de Entorno del Sistema
```bash
# En tu máquina local
$env:VITE_API_KEY = "tu-key-secreto"
```

### Opción 2: Archivo .env.local (NO subir a Git)
```
VITE_API_KEY=tu-key-secreto
```

### Opción 3: Secrets en GitHub/Render
En tu plataforma de deploy (Render, Vercel, etc.), configura secrets:
- `VITE_API_KEY` con el valor en producción

---

## 📝 Próximos Pasos

1. **Backend**: Configura lo mismo para Laravel (.env, .env.staging, .env.production)
2. **Docker**: Actualiza docker-compose.yml para cada ambiente
3. **CI/CD**: Configura GitHub Actions para deploy automático
4. **Bases de Datos**: Crea BD separadas para pruebas y producción

¿Necesitas ayuda con alguno de estos pasos?
