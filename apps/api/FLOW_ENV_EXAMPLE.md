# Variables de Entorno para Flow

⚠️ **IMPORTANTE**: Las credenciales de sandbox y producción son diferentes. No se pueden usar las credenciales de un ambiente en el otro.

## Sandbox (Desarrollo/Pruebas)

Para ambiente de sandbox, usar las siguientes variables:

```bash
# Flow Payment Gateway - SANDBOX
FLOW_API_URL=https://sandbox.flow.cl/api
FLOW_API_KEY=your-sandbox-api-key
FLOW_SECRET_KEY=your-sandbox-secret-key
FLOW_URL_CONFIRMATION=https://tudominio.com/api/payments/flow/confirmation
FLOW_URL_RETURN=https://tudominio.com/flow/return
```

**Características del sandbox:**

- Tarjetas de prueba funcionan
- Pagos de prueba no procesan dinero real
- Credenciales diferentes a producción

## Producción

Para ambiente de producción:

```bash
# Flow Payment Gateway - PRODUCCIÓN
FLOW_API_URL=https://www.flow.cl/api
FLOW_API_KEY=your-production-api-key
FLOW_SECRET_KEY=your-production-secret-key
FLOW_URL_CONFIRMATION=https://tudominio-prod.com/api/payments/flow/confirmation
FLOW_URL_RETURN=https://tudominio-prod.com/flow/return
```

**⚠️ Advertencia**: En producción, los pagos son REALES y se procesará dinero real.

---

**IMPORTANTE**:

- Nunca subir estas credenciales al repositorio
- Las credenciales de un ambiente no funcionan en el otro
- Configurar correctamente en tu cuenta de Flow (sandbox y producción)
