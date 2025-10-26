# Integración de Pagos con Flow

## Descripción

Este documento describe la integración completa con Flow para procesar pagos de gastos comunes en Comuniapp.

## Arquitectura

### Backend (NestJS)

#### Módulos

- **PaymentsModule**: Módulo principal que gestiona la integración con Flow
- **FlowService**: Servicio que maneja la comunicación con la API de Flow
- **PaymentsController**: Controlador REST que expone los endpoints de pago

#### Endpoints

1. **POST /payments/expense/:expenseId**
   - Crea una orden de pago en Flow para un gasto específico
   - Requiere autenticación JWT
   - Verifica que el usuario tenga acceso a la unidad del gasto
   - Retorna URL de checkout para redirigir al usuario

2. **POST /payments/flow/confirmation**
   - Webhook para recibir confirmaciones de Flow
   - Actualiza el estado del pago y del gasto
   - Responde en menos de 15 segundos
   - Implementa idempotencia

3. **GET /payments/status?token=xxx**
   - Consulta el estado de un pago por token de Flow
   - Retorna información de Flow y estado local del pago

### Frontend (Next.js)

#### Servicios

- **PaymentService**: Cliente para interactuar con la API de pagos

#### Páginas

1. **Mis Gastos** (`/dashboard/mis-gastos`)
   - Muestra lista de gastos del residente
   - Botón "Pagar" para gastos pendientes
   - Redirige al checkout de Flow

2. **Retorno de Flow** (`/flow/return`)
   - Página de destino después del pago
   - Consulta y muestra el estado final del pago
   - Maneja todos los estados: pagado, pendiente, rechazado, anulado

## Flujo de Pago

1. **Usuario** hace clic en "Pagar" en "Mis Gastos"
2. **Frontend** llama a `POST /payments/expense/:expenseId`
3. **Backend**:
   - Verifica permisos y estado del gasto
   - Crea orden en Flow con firma HMAC-SHA256
   - Crea registro Payment en BD (estado PENDING)
   - Retorna checkoutUrl
4. **Frontend** redirige al checkout de Flow
5. **Usuario** completa el pago en Flow
6. **Flow** envía webhook a `/payments/flow/confirmation`
7. **Backend**:
   - Consulta estado en Flow
   - Actualiza Payment y Expense según el resultado
   - Responde 200 OK
8. **Flow** redirige al usuario a `/flow/return?token=xxx`
9. **Frontend**:
   - Consulta estado final vía `/payments/status`
   - Muestra resultado al usuario

## Estados de Pago (Flow)

- **1**: Pendiente (medios asíncronos como efectivo)
- **2**: Pagado (exitoso)
- **3**: Rechazado
- **4**: Anulado

## Firma HMAC-SHA256

Todos los requests a Flow deben incluir una firma `s`:

```typescript
// 1. Ordenar parámetros alfabéticamente
const sortedKeys = Object.keys(params).sort();

// 2. Concatenar "clave + valor"
const concatenated = sortedKeys.map((key) => `${key}${params[key]}`).join('');

// 3. Generar firma
const signature = createHmac('sha256', secretKey).update(concatenated).digest('hex');

// 4. Agregar a parámetros
params.s = signature;
```

## Variables de Entorno

```bash
# Sandbox (desarrollo)
FLOW_API_URL=https://sandbox.flow.cl/api
FLOW_API_KEY=your-sandbox-api-key
FLOW_SECRET_KEY=your-sandbox-secret-key
FLOW_URL_CONFIRMATION=https://tudominio-dev.com/api/payments/flow/confirmation
FLOW_URL_RETURN=https://tudominio-dev.com/flow/return

# Producción
FLOW_API_URL=https://www.flow.cl/api
FLOW_API_KEY=your-production-api-key
FLOW_SECRET_KEY=your-production-secret-key
FLOW_URL_CONFIRMATION=https://tudominio.com/api/payments/flow/confirmation
FLOW_URL_RETURN=https://tudominio.com/flow/return
```

## Modelo de Datos

### Payment

```prisma
model Payment {
  id          String        @id @default(cuid())
  userId      String
  expenseId   String
  amount      Decimal       @db.Decimal(10, 2)
  status      PaymentStatus @default(PENDING) // PENDING, PAID, FAILED, REFUNDED
  method      PaymentMethod @default(FLOW)    // FLOW, BANK_TRANSFER, etc.
  reference   String?       // Token de Flow
  flowOrder   String?       // Flow Order ID
  paymentDate DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  expense     Expense       @relation(...)
  user        User          @relation(...)
}

enum PaymentMethod {
  BANK_TRANSFER
  CASH
  CHECK
  CARD
  FLOW
}
```

## Seguridad

1. **Credenciales**: NUNCA hardcodear API keys. Usar variables de entorno.
2. **Firma**: Validar siempre la firma HMAC-SHA256 en todos los requests.
3. **Webhook**: No requiere JWT, pero valida token por correlación.
4. **HTTPS**: Requerido para urlConfirmation y urlReturn.
5. **Timeouts**: Configurar timeouts razonables (8-10s).
6. **Idempotencia**: Prevenir actualizaciones duplicadas si Payment ya está PAID.

## Testing

### Ambiente Sandbox

1. Configurar variables de entorno para sandbox
2. Usar credenciales de prueba de Flow
3. Medios de pago de prueba disponibles en Flow

### Casos de Prueba

- ✅ Pago exitoso (status 2)
- ✅ Pago rechazado (status 3)
- ✅ Pago anulado (status 4)
- ✅ Pago pendiente con medio asíncrono (status 1)
- ✅ Intento de pago duplicado (validación backend)
- ✅ Webhook con reintento de Flow
- ✅ Usuario sin acceso a la unidad

## Troubleshooting

### Error: "Failed to create Flow payment order"

- Verificar credenciales en variables de entorno
- Revisar firma HMAC-SHA256
- Confirmar que todos los parámetros requeridos están presentes

### Error: "Payment not found for token"

- El webhook llegó antes de crear el Payment (race condition)
- Verificar que el reference (token) se guardó correctamente

### Error: "Expense is not pending payment"

- El gasto ya fue pagado o está en otro estado
- Frontend debe deshabilitar botón para gastos no-PENDING

### Webhook no recibe confirmaciones

- Verificar que urlConfirmation sea accesible públicamente (HTTPS)
- Confirmar que el endpoint responde 200 OK
- Revisar logs de Flow en su panel

## Recursos

- [Flow API v1 Documentation](https://www.flow.cl/docs/api.html)
- [Flow Sandbox](https://sandbox.flow.cl/)
- [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client)
- [NestJS HttpModule](https://docs.nestjs.com/techniques/http-module)

## Contacto y Soporte

Para soporte con Flow, contactar a:

- Email: soporte@flow.cl
- Web: https://www.flow.cl/
