# 🚀 Despliegue en Railway

Esta guía te ayudará a desplegar la API de Comuniapp en Railway con PostgreSQL.

## 📋 Prerrequisitos

1. Cuenta en [Railway](https://railway.app)
2. Git configurado
3. Railway CLI instalado (opcional)

## 🗄️ Configuración de Base de Datos

### 1. Crear Base de Datos PostgreSQL

1. Ve a tu dashboard de Railway
2. Crea un nuevo proyecto
3. Agrega un servicio **PostgreSQL**
4. Railway generará automáticamente la `DATABASE_URL`

### 2. Configurar Variables de Entorno

En tu proyecto de Railway, ve a **Variables** y configura:

```env
# Base de datos (Railway la genera automáticamente)
DATABASE_URL=postgresql://postgres:MbCXFKSxVSdAtpApWBKbHLVDoPvVgcrB@postgres.railway.internal:5432/railway

# Aplicación
NODE_ENV=production
PORT=3001

# JWT (¡IMPORTANTE! Cambia por una clave segura)
JWT_SECRET=tu-clave-super-secreta-aqui-minimo-32-caracteres
JWT_EXPIRES_IN=7d

# CORS (ajusta según tu dominio)
CORS_ORIGIN=https://tu-frontend.vercel.app,https://tu-dominio.com
```

## 🚀 Despliegue

### Opción 1: Conectando Repositorio Git

1. Conecta tu repositorio de GitHub a Railway
2. Railway detectará automáticamente que es un proyecto Node.js
3. Configura las variables de entorno
4. Railway desplegará automáticamente

### Opción 2: Con Railway CLI

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inicializar proyecto
railway init

# Conectar a base de datos
railway add postgresql

# Desplegar
railway up
```

## 📊 Ejecutar Migraciones

Una vez desplegado, ejecuta las migraciones:

```bash
# Conectar a tu servicio en Railway
railway connect

# Ejecutar migraciones
npx prisma migrate deploy

# Poblar datos iniciales
npx prisma db seed
```

## 🔧 Scripts de Railway

Puedes agregar estos scripts a tu `package.json`:

```json
{
  "scripts": {
    "railway:deploy": "railway up",
    "railway:logs": "railway logs",
    "railway:connect": "railway connect",
    "railway:migrate": "railway run npx prisma migrate deploy",
    "railway:seed": "railway run npx prisma db seed"
  }
}
```

## 🌐 Configuración de Dominio

1. En Railway, ve a **Settings** > **Domains**
2. Railway te dará un dominio automático (ej: `tu-app.railway.app`)
3. Puedes configurar un dominio personalizado si lo deseas

## 🔍 Monitoreo

- **Logs**: Ve a la pestaña **Deployments** para ver logs en tiempo real
- **Métricas**: Railway proporciona métricas básicas de CPU y memoria
- **Base de datos**: Puedes ver el estado de tu PostgreSQL en la pestaña **Data**

## ⚠️ Consideraciones Importantes

1. **JWT_SECRET**: Usa una clave segura y única para producción
2. **CORS**: Configura correctamente los orígenes permitidos
3. **Variables de entorno**: Nunca commitees archivos `.env` con datos sensibles
4. **Migraciones**: Ejecuta `prisma migrate deploy` en lugar de `prisma migrate dev`
5. **Seeds**: Los seeds solo se ejecutan una vez, úsalos para datos iniciales

## 🆘 Solución de Problemas

### Error de conexión a base de datos

- Verifica que `DATABASE_URL` esté configurada correctamente
- Asegúrate de que el servicio PostgreSQL esté activo

### Error de migraciones

```bash
# Resetear migraciones si es necesario
railway run npx prisma migrate reset
```

### Error de CORS

- Verifica que `CORS_ORIGIN` incluya tu dominio frontend
- Para desarrollo, puedes usar `*` (no recomendado para producción)

## 📚 Recursos Adicionales

- [Documentación de Railway](https://docs.railway.app)
- [Prisma con Railway](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-railway)
- [Variables de entorno en Railway](https://docs.railway.app/develop/variables)
