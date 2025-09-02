# Contratos

Este directorio contiene los contratos y especificaciones de la API.

## Archivos

- `openapi.yaml`: Especificación OpenAPI 3.0 de la API REST

## Uso

### Generar tipos TypeScript desde OpenAPI

Puedes usar herramientas como `openapi-typescript` o `orval` para generar tipos TypeScript desde la especificación OpenAPI:

```bash
# Con openapi-typescript
npx openapi-typescript contracts/openapi.yaml -o packages/types/src/api.ts

# Con orval
npx orval --input contracts/openapi.yaml --output packages/types/src/api.ts
```

### Validar la especificación

```bash
# Con swagger-codegen
npx @apidevtools/swagger-parser validate contracts/openapi.yaml

# Con redoc-cli
npx redoc-cli build contracts/openapi.yaml
```

## Convenciones

- Todos los endpoints deben estar documentados
- Los esquemas deben incluir ejemplos
- Usar códigos de estado HTTP estándar
- Incluir descripciones claras para cada endpoint
