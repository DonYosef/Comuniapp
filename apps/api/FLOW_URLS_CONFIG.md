# 🔗 Configuración de URLs para Flow en Localhost

## 📋 Resumen de Vistas Implementadas

### ✅ **Vistas Ya Implementadas**

#### 1. **Frontend - Página de Retorno**

- **Archivo:** `apps/web/src/app/flow/return/page.tsx`
- **Ruta:** `/flow/return`
- **Propósito:** Muestra el resultado del pago al usuario después de completar el checkout de Flow
- **Estado:** ✅ Implementada

#### 2. **Backend - Webhook de Confirmación**

- **Archivo:** `apps/api/src/payments/payments.controller.ts`
- **Método:** `POST /payments/flow/confirmation`
- **Propósito:** Recibe notificaciones de Flow sobre el estado del pago
- **Estado:** ✅ Implementada

## 🌐 Configuración de Variables de Entorno

### **Para Desarrollo Local (localhost:3000)**

Agregar las siguientes variables al archivo `.env` en `apps/api/`:

```bash
# Flow Payment Gateway - DESARROLLO LOCAL
FLOW_API_URL=https://www.flow.cl/api
FLOW_API_KEY=23F6A367-D75A-4A72-96A0-1L8229ED0D60
FLOW_SECRET_KEY=8a45c378d386269d719e3faf03236eee7c5d010c

# URLs para localhost (requiere túnel si pruebas con Flow real)
FLOW_URL_CONFIRMATION=http://localhost:3001/api/payments/flow/confirmation
FLOW_URL_RETURN=http://localhost:3000/flow/return
```

### **⚠️ Importante para Desarrollo Local**

**Problema:** Flow necesita acceder a tu servidor local desde internet, pero `localhost` no es accesible públicamente.

**Solución:** Usar un túnel como **ngrok** o **Cloudflare Tunnel** para exponer localhost:

```bash
# Instalar ngrok
npm install -g ngrok

# Exponer puerto 3001 (backend)
ngrok http 3001

# Exponer puerto 3000 (frontend) en otra terminal
ngrok http 3000

# Usar las URLs proporcionadas por ngrok:
FLOW_URL_CONFIRMATION=https://abc123.ngrok.io/api/payments/flow/confirmation
FLOW_URL_RETURN=https://xyz789.ngrok.io/flow/return
```

## 📍 URLs Completas por Servicio

### **Backend (NestJS - Puerto 3001)**

| Servicio     | URL Local                                              | URL con Túnel                                            |
| ------------ | ------------------------------------------------------ | -------------------------------------------------------- |
| API Base     | `http://localhost:3001`                                | `https://abc123.ngrok.io`                                |
| Health Check | `http://localhost:3001/health`                         | `https://abc123.ngrok.io/health`                         |
| Webhook Flow | `http://localhost:3001/api/payments/flow/confirmation` | `https://abc123.ngrok.io/api/payments/flow/confirmation` |

### **Frontend (Next.js - Puerto 3000)**

| Servicio     | URL Local                                    | URL con Túnel                                  |
| ------------ | -------------------------------------------- | ---------------------------------------------- |
| App Base     | `http://localhost:3000`                      | `https://xyz789.ngrok.io`                      |
| Retorno Flow | `http://localhost:3000/flow/return`          | `https://xyz789.ngrok.io/flow/return`          |
| Mis Gastos   | `http://localhost:3000/dashboard/mis-gastos` | `https://xyz789.ngrok.io/dashboard/mis-gastos` |

## 🔄 Flujo Completo del Pago

```
1. Usuario hace clic en "Pagar" en "Mis Gastos"
   ↓
2. Frontend llama: POST /api/payments/expense/:expenseId
   ↓
3. Backend crea orden en Flow y retorna checkoutUrl
   ↓
4. Usuario es redirigido a Flow para pagar
   ↓
5. Usuario completa el pago en Flow
   ↓
6. Flow redirige a: FLOW_URL_RETURN (con ?token=xxx)
   ├── Frontend muestra resultado en /flow/return
   └── Flow envía webhook a: FLOW_URL_CONFIRMATION
       ↓
7. Backend actualiza Payment y Expense en BD
   ↓
8. Usuario ve confirmación en /flow/return
```

## 🔍 Verificación de Configuración

### 1. Verificar Backend

```bash
# Verificar que el servidor esté corriendo
curl http://localhost:3001/health

# Verificar que el webhook esté disponible (requiere ngrok)
curl https://abc123.ngrok.io/api/payments/flow/confirmation
```

### 2. Verificar Frontend

```bash
# Verificar que la app esté corriendo
curl http://localhost:3000

# Abrir en navegador
http://localhost:3000/dashboard/mis-gastos
```

### 3. Verificar Variables de Entorno

```bash
# En apps/api/.env debe contener:
FLOW_API_URL=https://www.flow.cl/api
FLOW_API_KEY=tu-api-key
FLOW_SECRET_KEY=tu-secret-key
FLOW_URL_CONFIRMATION=http://localhost:3001/api/payments/flow/confirmation
FLOW_URL_RETURN=http://localhost:3000/flow/return
```

## 🧪 Pruebas sin Túnel (Solo Frontend)

Si solo quieres probar el flujo del frontend sin configurar un túnel:

1. **Backend local:** `http://localhost:3001`
2. **Frontend local:** `http://localhost:3000`
3. **Las URLs deben apuntar a localhost directamente**

```bash
# En apps/api/.env
FLOW_URL_CONFIRMATION=http://localhost:3001/api/payments/flow/confirmation
FLOW_URL_RETURN=http://localhost:3000/flow/return
```

⚠️ **Nota:** Flow NO podrá enviar el webhook de confirmación, pero puedes simular la página de retorno.

## 📝 Resumen de URLs para Copiar

```bash
# Para .env en apps/api/
FLOW_API_URL=https://www.flow.cl/api
FLOW_API_KEY=23F6A367-D75A-4A72-96A0-1L8229ED0D60
FLOW_SECRET_KEY=8a45c378d386269d719e3faf03236eee7c5d010c
FLOW_URL_CONFIRMATION=http://localhost:3001/api/payments/flow/confirmation
FLOW_URL_RETURN=http://localhost:3000/flow/return
```

## 🎯 Siguiente Paso

Después de configurar el `.env`, reinicia el servidor backend para que tome las nuevas variables:

```bash
# En apps/api/
pnpm run dev
```
